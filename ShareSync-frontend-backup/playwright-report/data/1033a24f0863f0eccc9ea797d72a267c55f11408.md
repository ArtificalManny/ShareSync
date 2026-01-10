# Page snapshot

```yaml
- generic [ref=e1]:
  - link "Skip to main content":
    - /url: "#main"
  - generic [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e6]:
        - banner [ref=e8]:
          - generic [ref=e9]:
            - link "ShareSync" [ref=e10] [cursor=pointer]:
              - /url: /
            - link "Home" [ref=e11] [cursor=pointer]:
              - /url: /
            - link "Login" [ref=e12] [cursor=pointer]:
              - /url: /login
            - link "Register" [ref=e13] [cursor=pointer]:
              - /url: /register
          - button "Dark Mode" [ref=e14] [cursor=pointer]
        - generic [ref=e16]:
          - heading "Register" [level=2] [ref=e17]
          - textbox "Email" [ref=e19]: test1768059720577@example.com
          - textbox "Username" [ref=e21]: testuser1768059720577
          - textbox "First Name" [ref=e23]: Test
          - textbox "Last Name" [ref=e25]: User
          - textbox "Password" [ref=e27]: TestPassword123!
          - button "Register" [active] [ref=e28] [cursor=pointer]
      - region "Notifications"
    - region "Notifications"
```