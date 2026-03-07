import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { SignupEmail } from '../_shared/email-templates/signup.tsx'
import { InviteEmail } from '../_shared/email-templates/invite.tsx'
import { MagicLinkEmail } from '../_shared/email-templates/magic-link.tsx'
import { RecoveryEmail } from '../_shared/email-templates/recovery.tsx'
import { EmailChangeEmail } from '../_shared/email-templates/email-change.tsx'
import { ReauthenticationEmail } from '../_shared/email-templates/reauthentication.tsx'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const EMAIL_SUBJECTS: Record<string, string> = {
  signup: 'Confirm your email',
  invite: "You've been invited",
  magiclink: 'Your login link',
  recovery: 'Reset your password',
  email_change: 'Confirm your new email',
  reauthentication: 'Your verification code',
}

const EMAIL_TEMPLATES: Record<string, React.ComponentType<any>> = {
  signup: SignupEmail,
  invite: InviteEmail,
  magiclink: MagicLinkEmail,
  recovery: RecoveryEmail,
  email_change: EmailChangeEmail,
  reauthentication: ReauthenticationEmail,
}

// Configuration - update these for your deployment
const SITE_NAME = "smart-watch-pro"
const SITE_URL = Deno.env.get("SITE_URL") || "https://smart-watch-pro.lovable.app"
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || `${SITE_NAME} <onboarding@resend.dev>`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    
    // Support both direct call and Supabase Auth Hook format
    // Supabase Auth Hook sends: { user, email_data: { token, token_hash, redirect_to, email_action_type, ... } }
    // Direct call sends: { type, email, url, token, new_email }
    
    let emailType: string
    let recipientEmail: string
    let confirmationUrl: string
    let token: string | undefined
    let newEmail: string | undefined

    if (body.email_data) {
      // Supabase Auth Hook format
      emailType = body.email_data.email_action_type || body.email_data.type || 'signup'
      recipientEmail = body.user?.email || body.email_data.email || ''
      token = body.email_data.token || ''
      newEmail = body.email_data.new_email || body.user?.new_email
      
      // Build confirmation URL from token_hash and redirect_to
      const tokenHash = body.email_data.token_hash || ''
      const redirectTo = body.email_data.redirect_to || SITE_URL
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
      
      // Standard Supabase confirmation URL format
      if (tokenHash) {
        const typeMap: Record<string, string> = {
          signup: 'signup',
          invite: 'invite',
          magiclink: 'magiclink',
          recovery: 'recovery',
          email_change: 'email_change',
        }
        const authType = typeMap[emailType] || emailType
        confirmationUrl = `${supabaseUrl}/auth/v1/verify?token=${tokenHash}&type=${authType}&redirect_to=${encodeURIComponent(redirectTo)}`
      } else if (body.email_data.confirmation_url) {
        confirmationUrl = body.email_data.confirmation_url
      } else {
        confirmationUrl = redirectTo
      }
    } else {
      // Direct call format
      emailType = body.type || body.action_type || 'signup'
      recipientEmail = body.email || ''
      confirmationUrl = body.url || body.confirmation_url || SITE_URL
      token = body.token
      newEmail = body.new_email
    }

    console.log('Processing auth email', { emailType, email: recipientEmail })

    const EmailTemplate = EMAIL_TEMPLATES[emailType]
    if (!EmailTemplate) {
      console.error('Unknown email type', { emailType })
      return new Response(
        JSON.stringify({ error: `Unknown email type: ${emailType}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const templateProps = {
      siteName: SITE_NAME,
      siteUrl: SITE_URL,
      recipient: recipientEmail,
      confirmationUrl,
      token: token || '',
      email: recipientEmail,
      newEmail: newEmail || '',
    }

    const html = await renderAsync(React.createElement(EmailTemplate, templateProps))
    const text = await renderAsync(React.createElement(EmailTemplate, templateProps), {
      plainText: true,
    })

    // Send via Resend
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [recipientEmail],
        subject: EMAIL_SUBJECTS[emailType] || 'Notification',
        html,
        text,
      }),
    })

    const resendData = await resendRes.json()

    if (!resendRes.ok) {
      console.error('Resend API error', resendData)
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: resendData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Email sent successfully', { message_id: resendData.id, emailType })

    return new Response(
      JSON.stringify({ success: true, message_id: resendData.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Auth email hook error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})