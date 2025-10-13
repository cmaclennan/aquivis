import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@aquivis.app'

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Resend API key not configured' }, { status: 500 })
    }
    const resend = new Resend(apiKey)
    const { to, inviteLink, role, firstName, lastName } = await req.json()
    if (!to || !inviteLink) {
      return NextResponse.json({ error: 'Missing to or inviteLink' }, { status: 400 })
    }

    const subject = 'Aquivis Team Invitation'
    const safeName = [firstName, lastName].filter(Boolean).join(' ').trim()

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="background-color: #2090c3; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 40px; color: white;">🌊</span>
          </div>
          <h1 style="color: #2090c3; margin-top: 20px;">Aquivis Invitation</h1>
          <p style="color: #6b7280;">You've been invited to join Aquivis${role ? ` as ${role}` : ''}.</p>
        </div>
        <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <p style="color: #4b5563; line-height: 1.6;">
            ${safeName ? `${safeName}, ` : ''}click the button below to accept your invitation.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteLink}"
               style="background-color: #2090c3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
              Accept Invitation
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">Or copy and paste this link:<br>
            <a href="${inviteLink}" style="color: #2090c3; word-break: break-all;">${inviteLink}</a>
          </p>
        </div>
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
          <p style="color: #6b7280; font-size: 12px; text-align: center;">
            © 2025 Aquivis Pool Service Management
          </p>
        </div>
      </div>
    `

    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html,
    })
    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to send' }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 })
  }
}


