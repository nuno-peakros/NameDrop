# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - img "NameDrop Logo" [ref=e7]
      - generic [ref=e8]: Welcome back
      - generic [ref=e9]: Sign in to your account to continue
    - generic [ref=e10]:
      - generic [ref=e11]:
        - generic [ref=e12]: Failed to fetch
        - generic [ref=e13]:
          - generic [ref=e14]: Email
          - textbox "Email" [ref=e15]: user@example.com
        - generic [ref=e16]:
          - generic [ref=e17]: Password
          - textbox "Password" [ref=e18]: password123
        - button "Sign in" [ref=e19]
      - paragraph [ref=e21]:
        - text: Don't have an account?
        - button "Contact administrator" [ref=e22]
  - generic [ref=e27] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e28] [cursor=pointer]:
      - img [ref=e29] [cursor=pointer]
    - generic [ref=e32] [cursor=pointer]:
      - button "Open issues overlay" [ref=e33] [cursor=pointer]:
        - generic [ref=e34] [cursor=pointer]:
          - generic [ref=e35] [cursor=pointer]: "0"
          - generic [ref=e36] [cursor=pointer]: "1"
        - generic [ref=e37] [cursor=pointer]: Issue
      - button "Collapse issues badge" [ref=e38] [cursor=pointer]:
        - img [ref=e39] [cursor=pointer]
  - alert [ref=e41]
```