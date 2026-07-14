const transporter = require("../config/mail");

const sendOTP = async (email, otp) => {

    await transporter.sendMail({

        from: `"InvoiceHub" <${process.env.EMAIL_USER}>`,

        to: email,

        subject: "Verify your InvoiceHub account",

       html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>InvoiceHub Email Verification</title>
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
"
>

<tr>
<td
style="
background:linear-gradient(135deg,#2563eb,#1d4ed8);
padding:30px;
text-align:center;
"
>

<h1 style="
margin:0;
color:#fff;
font-size:30px;
font-weight:700;
">
InvoiceHub
</h1>

<p style="
margin:10px 0 0;
color:#dbeafe;
font-size:15px;
">
Professional Invoice Management
</p>

</td>
</tr>

<tr>

<td style="padding:40px;">

<h2 style="
margin:0 0 20px;
color:#111827;
font-size:24px;
">
Verify Your Email
</h2>

<p style="
margin:0 0 20px;
font-size:16px;
color:#4b5563;
line-height:1.7;
">
Hello,
</p>

<p style="
margin:0 0 25px;
font-size:16px;
color:#4b5563;
line-height:1.7;
">
Thank you for creating your InvoiceHub account.
To complete your registration, please enter the verification code below.
</p>

<div
style="
background:#eff6ff;
border:2px dashed #2563eb;
border-radius:12px;
padding:25px;
text-align:center;
margin:30px 0;
"
>

<div style="
font-size:13px;
letter-spacing:2px;
color:#2563eb;
font-weight:600;
text-transform:uppercase;
margin-bottom:10px;
">
Verification Code
</div>

<div style="
font-size:40px;
font-weight:700;
letter-spacing:12px;
color:#1d4ed8;
">
${otp}
</div>

</div>    

</td>

</tr>

<tr>

<td
style="
padding:35px 40px;
background:#f8fafc;
border-top:1px solid #e5e7eb;
"
>

<h3
style="
margin:0;
font-size:18px;
color:#111827;
font-weight:600;
"
>
Need help?
</h3>

<p
style="
margin:12px 0 0;
font-size:15px;
line-height:26px;
color:#4b5563;
"
>
If you're experiencing any issues verifying your account,
our support team is always happy to help.
</p>

<p
style="
margin:18px 0 0;
font-size:15px;
"
>
<strong style="color:#111827;">
Support:
</strong>

<a
href="mailto:support.invoicehub@gmail.com"
style="
color:#2563eb;
text-decoration:none;
font-weight:600;
"
>
support.invoicehub@gmail.com
</a>
</p>
<hr
style="
margin:30px 0;
border:none;
border-top:1px solid #e5e7eb;
"
/>

<div style="text-align:center;">

<p
style="
margin:0;
font-size:22px;
font-weight:700;
color:#111827;
"
>
Thank you for choosing
<span style="color:#2563eb;">InvoiceHub</span>.
</p>

<p
style="
margin:12px 0 0;
font-size:16px;
color:#6b7280;
font-weight:500;
"
>
The InvoiceHub Team
</p>

<p
style="
margin:28px auto 0;
max-width:430px;
font-size:13px;
line-height:22px;
color:#9ca3af;
"
>
This is an automated email from
<strong>InvoiceHub</strong>.
Please do not reply directly to this message.
</p>

<p
style="
margin-top:18px;
font-size:13px;
color:#9ca3af;
"
>
© ${new Date().getFullYear()} InvoiceHub. All rights reserved.
</p>

</div>

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

module.exports = sendOTP;