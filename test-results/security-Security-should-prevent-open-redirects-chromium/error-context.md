# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]: "404"
      - generic [ref=e7]:
        - generic [ref=e8]: Page Not Found
        - generic [ref=e9]: The page you're looking for doesn't exist
    - generic [ref=e10]:
      - paragraph [ref=e12]: The page you requested could not be found. It may have been moved, deleted, or you may have entered an incorrect URL.
      - generic [ref=e13]:
        - link "Go to Home" [ref=e14] [cursor=pointer]:
          - /url: /
          - button "Go to Home" [ref=e15]:
            - img
            - text: Go to Home
        - button "Go Back" [ref=e16]:
          - img
          - text: Go Back
        - link "Sign In" [ref=e17] [cursor=pointer]:
          - /url: /login
          - button "Sign In" [ref=e18]
      - paragraph [ref=e20]: Need help? Contact support@peakros.com
  - alert [ref=e21]
```