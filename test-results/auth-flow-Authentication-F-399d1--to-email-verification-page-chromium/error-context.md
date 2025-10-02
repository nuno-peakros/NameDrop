# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - img "NameDrop Logo" [ref=e7]
      - generic [ref=e8]: Verify Your Email
      - generic [ref=e9]: Enter the verification token sent to your email address
    - generic [ref=e10]:
      - generic [ref=e11]:
        - generic [ref=e12]:
          - generic [ref=e13]: Verification Token
          - textbox "Verification Token" [ref=e14]
        - button "Verify Email" [ref=e15]
      - generic [ref=e16]:
        - paragraph [ref=e18]:
          - text: Didn't receive the email?
          - button "Resend verification email" [ref=e19]
        - paragraph [ref=e21]: Check your spam folder if you don't see the email
  - button "Open Next.js Dev Tools" [ref=e27] [cursor=pointer]:
    - img [ref=e28] [cursor=pointer]
  - alert [ref=e31]
```