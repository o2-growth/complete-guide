import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Oxy Growth OS'

interface WorkspaceInviteProps {
  tenantName?: string
  role?: string
  acceptUrl?: string
}

const WorkspaceInviteEmail = ({ tenantName, role, acceptUrl }: WorkspaceInviteProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Você foi convidado para {tenantName ?? 'um workspace'} no {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>
          Você foi convidado para <strong>{tenantName ?? 'um workspace'}</strong>
        </Heading>
        <Text style={text}>
          Você recebeu um convite para colaborar como <strong>{role ?? 'membro'}</strong> no
          workspace <strong>{tenantName ?? ''}</strong> no {SITE_NAME}.
        </Text>
        {acceptUrl ? (
          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button href={acceptUrl} style={button}>Aceitar convite</Button>
          </Section>
        ) : null}
        <Text style={footer}>Este convite expira em 14 dias.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WorkspaceInviteEmail,
  subject: (data: Record<string, any>) =>
    `Convite para ${data.tenantName ?? 'workspace'} no ${SITE_NAME}`,
  displayName: 'Convite de workspace',
  previewData: {
    tenantName: 'O2 Inc.',
    role: 'specialist',
    acceptUrl: 'https://example.com/aceitar-convite/abc123',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '32px 24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: '0 0 16px' }
const button = {
  backgroundColor: '#0EA5E9', color: '#ffffff', padding: '12px 24px',
  borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '14px',
}
const footer = { fontSize: '12px', color: '#94a3b8', margin: '32px 0 0' }