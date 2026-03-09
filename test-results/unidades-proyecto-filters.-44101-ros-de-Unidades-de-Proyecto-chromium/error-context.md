# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - alert [ref=e2]
  - generic [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e7]: AC
      - heading "Sistema de Gestión de Proyectos" [level=1] [ref=e8]
      - paragraph [ref=e9]: Alcaldía Distrital de Santiago de Cali
    - generic [ref=e10]:
      - generic [ref=e11]:
        - button "Iniciar Sesión" [ref=e12] [cursor=pointer]
        - button "Registrarse" [ref=e13] [cursor=pointer]
      - generic [ref=e14]:
        - button "Continuar con Google" [ref=e15] [cursor=pointer]:
          - img [ref=e16]
          - generic [ref=e21]: Continuar con Google
        - generic [ref=e26]: o continúa con email
        - generic [ref=e27]:
          - generic [ref=e28]:
            - generic [ref=e29]: Correo electrónico
            - textbox "tu.email@cali.gov.co" [ref=e30]
          - generic [ref=e31]:
            - generic [ref=e32]: Contraseña
            - generic [ref=e33]:
              - textbox "••••••••" [ref=e34]
              - button [ref=e35] [cursor=pointer]:
                - img [ref=e36]
          - generic [ref=e39]:
            - generic [ref=e40]:
              - checkbox "Recordar mi sesión" [checked] [ref=e41]
              - generic [ref=e42]: Recordar mi sesión
            - button "¿Olvidó su contraseña?" [ref=e43] [cursor=pointer]
          - button "Iniciar Sesión" [disabled] [ref=e44]
    - paragraph [ref=e46]: © 2025 Alcaldía de Santiago de Cali
```