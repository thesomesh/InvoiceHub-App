const transporter = require("../config/mail");

const sendResetPasswordEmail = async (email, resetLink) => {
  await transporter.sendMail({
    from: `"InvoiceHub" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Reset your InvoiceHub password",

    html: `
<!DOCTYPE html>
<html>

<head>
<meta charset="UTF-8">
<title>Reset Password</title>
</head>

<body style="
margin:0;
padding:40px 0;
background:#f4f7fb;
font-family:Arial,Helvetica,sans-serif;
">

<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center">

<table
width="600"
cellpadding="0"
cellspacing="0"
style="
background:#ffffff;
border-radius:14px;
overflow:hidden;
box-shadow:0 8px 30px rgba(0,0,0,.08);
">

<!-- Header -->

<tr>

<td
style="
background:linear-gradient(135deg,#2563eb,#1d4ed8);
padding:34px;
text-align:center;
">

<h1
style="
margin:0;
color:#ffffff;
font-size:30px;
font-weight:700;
">
InvoiceHub
</h1>

<p
style="
margin:10px 0 0;
font-size:15px;
color:#dbeafe;
">
Professional Invoice Management
</p>

</td>

</tr>

<!-- Body -->

<tr>

<td style="padding:48px 42px;">

<h2
style="
margin:0;
font-size:30px;
font-weight:700;
color:#111827;
">
Reset Your Password
</h2>

<p
style=",
margin:24px 0 0;
font-size:16px;
line-height:30px;
color:#4b5563;
">
We received a request to reset your
<strong>InvoiceHub</strong> password.
</p>

<p
style="
margin:18px 0 0;
font-size:16px;
line-height:30px;
color:#4b5563;
">
Click the button below to create a new password.
</p>

<div
style="
text-align:center;
margin:42px 0;
">

<a
href="${resetLink}"
style="
display:inline-block;
background:#2563eb;
color:#ffffff;
text-decoration:none;
padding:15px 34px;
border-radius:10px;
font-size:16px;
font-weight:600;
">
Reset Password
</a>

</div>

<p
style="
margin:0;
font-size:15px;
line-height:28px;
color:#4b5563;
">
This password reset link will expire in
<strong>15 minutes</strong>.
</p>

<p
style="
margin:18px 0 0;
font-size:15px;
line-height:28px;
color:#4b5563;
">
If you didn't request a password reset,
you can safely ignore this email.
Your password will remain unchanged.
</p>

<hr
style="
border:none;
border-top:1px solid #e5e7eb;
margin:40px 0;
">

<p
style="
margin:0;
font-size:15px;
line-height:28px;
color:#4b5563;
">
Having trouble with the button?
Copy and paste this link into your browser:
</p>

<p
style="
margin-top:18px;
word-break:break-all;
">

<a
href="${resetLink}"
style="
color:#2563eb;
text-decoration:none;
">
${resetLink}
</a>

</p>

</td>

</tr>

<!-- Footer -->

<tr>

<td
style="
padding:38px 42px;
background:#f8fafc;
border-top:1px solid #e5e7eb;
text-align:center;
">

<p
style="
margin:0;
font-size:22px;
font-weight:700;
color:#111827;
">
InvoiceHub
</p>

<p
style="
margin:18px auto 0;
max-width:440px;
font-size:15px;
line-height:28px;
color:#6b7280;
">
This is an automated security email.
Please do not reply directly to this message.
</p>

<p
style="
margin-top:24px;
font-size:13px;
color:#9ca3af;
">
© ${new Date().getFullYear()} InvoiceHub. All rights reserved.
</p>

</td>

</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`,
  });
};

module.exports = sendResetPasswordEmail;