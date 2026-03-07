/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="bn" dir="ltr">
    <Head />
    <Preview>{siteName} — ইমেইল পরিবর্তন নিশ্চিত করুন</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={brandName}>{siteName}</Heading>
        </Section>
        <Section style={content}>
          <Heading style={h1}>ইমেইল পরিবর্তন নিশ্চিত করুন</Heading>
          <Text style={text}>
            আপনি আপনার {siteName} অ্যাকাউন্টের ইমেইল{' '}
            <Link href={`mailto:${email}`} style={link}>{email}</Link>{' '}
            থেকে{' '}
            <Link href={`mailto:${newEmail}`} style={link}>{newEmail}</Link>{' '}
            -এ পরিবর্তন করতে চেয়েছেন।
          </Text>
          <Text style={text}>
            এই পরিবর্তন নিশ্চিত করতে নিচের বাটনে ক্লিক করুন:
          </Text>
          <Button style={button} href={confirmationUrl}>
            ইমেইল পরিবর্তন নিশ্চিত করুন
          </Button>
          <Text style={footer}>
            আপনি যদি এই পরিবর্তন অনুরোধ না করে থাকেন, অনুগ্রহ করে আপনার অ্যাকাউন্ট সুরক্ষিত করুন।
          </Text>
        </Section>
        <Section style={bottomBar}>
          <Text style={bottomText}>{siteName}</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Noto Sans Bengali', Arial, sans-serif" }
const container = { maxWidth: '560px', margin: '0 auto', borderRadius: '16px', overflow: 'hidden' as const, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }
const header = { backgroundColor: '#0a0a0a', padding: '32px 40px', textAlign: 'center' as const }
const brandName = { margin: '0', color: '#b8963e', fontSize: '22px', fontWeight: '700' as const, letterSpacing: '0.5px' }
const content = { padding: '40px' }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: '#0a0a0a', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 25px' }
const link = { color: '#b8963e', textDecoration: 'underline' }
const button = { backgroundColor: '#0a0a0a', color: '#ffffff', fontSize: '14px', borderRadius: '12px', padding: '14px 28px', textDecoration: 'none', fontWeight: '600' as const }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
const bottomBar = { backgroundColor: '#0a0a0a', padding: '16px 40px', textAlign: 'center' as const }
const bottomText = { margin: '0', color: '#b8963e', fontSize: '12px', fontWeight: '600' as const }
