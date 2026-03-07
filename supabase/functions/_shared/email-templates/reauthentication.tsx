/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="bn" dir="ltr">
    <Head />
    <Preview>আপনার যাচাইকরণ কোড</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={headerText}>নিরাপত্তা যাচাই</Text>
        </Section>
        <Section style={content}>
          <Heading style={h1}>পরিচয় নিশ্চিত করুন</Heading>
          <Text style={text}>আপনার পরিচয় নিশ্চিত করতে নিচের কোডটি ব্যবহার করুন:</Text>
          <Text style={codeStyle}>{token}</Text>
          <Text style={footer}>
            এই কোডটি অল্প সময়ের মধ্যে মেয়াদোত্তীর্ণ হবে। আপনি যদি এটি অনুরোধ না করে থাকেন, তাহলে এই ইমেইল উপেক্ষা করুন।
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Noto Sans Bengali', Arial, sans-serif" }
const container = { maxWidth: '560px', margin: '0 auto', borderRadius: '16px', overflow: 'hidden' as const, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }
const header = { backgroundColor: '#0a0a0a', padding: '24px 40px', textAlign: 'center' as const }
const headerText = { margin: '0', color: '#b8963e', fontSize: '16px', fontWeight: '700' as const, letterSpacing: '0.5px' }
const content = { padding: '40px' }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: '#0a0a0a', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 25px' }
const codeStyle = { fontFamily: "'Inter', Courier, monospace", fontSize: '28px', fontWeight: '700' as const, color: '#b8963e', margin: '0 0 30px', letterSpacing: '4px' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
