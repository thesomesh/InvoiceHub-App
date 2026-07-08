const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendWelcomeEmail = async (user) => {

    await transporter.sendMail({

        from: `"InvoiceHub" <${process.env.EMAIL_USER}>`,

        to: user.email,

        subject: "Welcome to InvoiceHub ",

  html: `
<!DOCTYPE html>
<html>

<head>
<meta charset="UTF-8">
<title>Welcome to InvoiceHub</title>
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

<!-- Content -->

<tr>

<td style="padding:48px 42px;">

<h2
style="
margin:0;
font-size:30px;
font-weight:700;
color:#111827;
">
Welcome to InvoiceHub
</h2>

<p
style="
margin:24px 0 0;
font-size:16px;
line-height:30px;
color:#4b5563;
">
Hi <strong>${user.name}</strong>,
</p>

<p
style="
margin:18px 0 0;
font-size:16px;
line-height:30px;
color:#4b5563;
">

Thank you for choosing
<strong>InvoiceHub</strong>.
</p>


<p
style="
margin:18px 0 0;
font-size:16px;
line-height:30px;
color:#4b5563;
">

Your workspace is ready.

Click below to access your dashboard and start creating professional invoices.

</p>

<!-- CTA -->

<div
style="
text-align:center;
margin:42px 0;
">

<a
href="${process.env.CLIENT_URL}/dashboard"
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
Get Started
</a>

</div>

<hr
style="
border:none;
border-top:1px solid #e5e7eb;
margin:40px 0;
">

<h3
style="
margin:0;
font-size:20px;
color:#111827;
">
Need assistance?
</h3>

<p
style="
margin:16px 0 0;
font-size:15px;
line-height:28px;
color:#4b5563;
">

If you have any questions or need help getting started,
our support team is always happy to assist you.

</p>

<p
style="
margin:18px 0 0;
font-size:15px;
">

<strong>Support</strong>

<br><br>

<a
href="mailto:support@invoicehub.com"
style="
color:#2563eb;
text-decoration:none;
font-weight:600;
">
support@invoicehub.com
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
Thank you for placing your trust in
<span style="color:#2563eb;">InvoiceHub</span>.
</p>

<p
style="
margin:18px auto 0;
max-width:440px;
font-size:15px;
line-height:28px;
color:#6b7280;
">
We appreciate the opportunity to support your business and look forward to helping you simplify your invoicing experience.
</p>

<p
style="
margin-top:28px;
font-size:16px;
font-weight:600;
color:#111827;
">
The InvoiceHub Team
</p>

<p
style="
margin-top:24px;
font-size:13px;
line-height:22px;
color:#9ca3af;
">
This is an automated email from
<strong>InvoiceHub</strong>.<br>
Please do not reply directly to this message.
</p>

<p
style="
margin-top:18px;
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
`
    });

};

module.exports = sendWelcomeEmail;