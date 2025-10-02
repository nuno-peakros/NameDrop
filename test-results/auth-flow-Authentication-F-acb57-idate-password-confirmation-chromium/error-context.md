# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - img "NameDrop Logo" [ref=e7]
      - generic [ref=e8]: Change Password
      - generic [ref=e9]: Update your password to keep your account secure
    - generic [ref=e10]:
      - generic [ref=e11]:
        - generic [ref=e12]:
          - generic [ref=e13]: Current Password
          - generic [ref=e14]:
            - textbox "Current Password" [ref=e15]: currentPassword123
            - button "Show password" [ref=e16]: 👁️‍🗨️
        - generic [ref=e17]:
          - generic [ref=e18]: New Password
          - generic [ref=e19]:
            - textbox "New Password" [active] [ref=e20]: newPassword123
            - button "Show password" [ref=e21]: 👁️‍🗨️
          - generic [ref=e26]: Strong
        - button "Update Password" [ref=e27]
      - paragraph [ref=e29]: Remember to use a strong, unique password
  - button "Open Next.js Dev Tools" [ref=e35] [cursor=pointer]:
    - img [ref=e36] [cursor=pointer]
  - alert [ref=e39]
```