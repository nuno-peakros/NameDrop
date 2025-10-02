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
        - generic [ref=e12]:
          - generic [ref=e13]: Email
          - textbox "Email" [ref=e14]: admin@example.com
        - generic [ref=e15]:
          - generic [ref=e16]: Password
          - textbox "Password" [ref=e17]: password
        - button "Signing in..." [disabled]:
          - generic: Signing in...
      - paragraph [ref=e19]:
        - text: Don't have an account?
        - button "Contact administrator" [ref=e20]
  - button "Open Next.js Dev Tools" [ref=e26] [cursor=pointer]:
    - img [ref=e27] [cursor=pointer]
  - alert [ref=e30]
```