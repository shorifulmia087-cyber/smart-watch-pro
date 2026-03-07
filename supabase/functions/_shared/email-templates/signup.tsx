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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="bn" dir="ltr">
    <Head />
    <Preview>{siteName} — ইমেইল যাচাই করুন</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={brandName}>{siteName}</Heading>
          <Text style={brandTagline}>প্রিমিয়াম ক্রাফটসম্যানশিপ</Text>
        </Section>
        <Section style={content}>
          <Heading style={h1}>ইমেইল যাচাই করুন</Heading>
          <Text style={text}>
            <Link href={siteUrl} style={link}>
              <strong>{siteName}</strong>
            </Link>{' '}
            -এ অ্যাকাউন্ট তৈরি করার জন্য ধন্যবাদ!
          </Text>
          <Text style={text}>
            আপনার ইমেইল অ্যাড্রেস (
            <Link href={`mailto:${recipient}`} style={link}>
              {recipient}
            </Link>
            ) যাচাই করতে নিচের বাটনে ক্লিক করুন:
          </Text>
          <Button style={button} href={confirmationUrl}>
            ইমেইল যাচাই করুন
          </Button>
          <Text style={footer}>
            আপনি যদি এই অ্যাকাউন্ট তৈরি না করে থাকেন, তাহলে এই ইমেইল উপেক্ষা করতে পারেন।
          </Text>
        </Section>
        <Section style={bottomBar}>
          <Text style={bottomText}>{siteName}</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Noto Sans Bengali', Arial, sans-serif" }
const container = { maxWidth: '560px', margin: '0 auto', borderRadius: '16px', overflow: 'hidden' as const, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }
const header = { backgroundColor: '#0a0a0a', padding: '32px 40px', textAlign: 'center' as const }
const brandName = { margin: '0', color: '#b8963e', fontSize: '22px', fontWeight: '700' as const, letterSpacing: '0.5px' }
const brandTagline = { margin: '6px 0 0', color: '#666666', fontSize: '12px', letterSpacing: '2px' }
const content = { padding: '40px' }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: '#0a0a0a', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 25px' }
const link = { color: '#b8963e', textDecoration: 'underline' }
const button = { backgroundColor: '#0a0a0a', color: '#ffffff', fontSize: '14px', borderRadius: '12px', padding: '14px 28px', textDecoration: 'none', fontWeight: '600' as const }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
const bottomBar = { backgroundColor: '#0a0a0a', padding: '16px 40px', textAlign: 'center' as const }
const bottomText = { margin: '0', color: '#b8963e', fontSize: '12px', fontWeight: '600' as const }
