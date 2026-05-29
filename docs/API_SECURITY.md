# API Security in Django Rest Framework

Exposing an API means exposing attack surface. A banking app with an unsecured API can leak account data, allow unauthorized transactions, or be taken down entirely. This covers the core security measures you need to apply in DRF:

- **Authentication**: Verifying the identity of the users accessing the API.
- **Authorization**: Ensuring that authenticated users have permission to perform specific actions.
- **Rate Limiting**: Controlling the number of requests a user can make to the API in a given time period.
- **Throttling**: Similar to rate limiting, but can be applied to specific actions or endpoints.
- **CORS (Cross-Origin Resource Sharing)**: Managing how resources on your server can be requested from another domain.
- **Using HTTPS**: Encrypting data transmitted between the client and server to prevent eavesdropping.
- **Input Validation and Sanitization**: Ensuring that the data sent to the API is valid and safe to process.
- **Data Encryption**: Protecting sensitive data stored in your database.

---

## Authentication

Authentication is how you verify who is making a request. DRF supports several mechanisms out of the box:

### Authentication Methods in DRF

**Session Authentication:**
- Works similarly to Django's session-based authentication.
- Requires clients to include a CSRF token.
- Suitable for browser-based applications.

**Token Authentication:**
- Clients authenticate by including an API token in the request header.
- Stateless, as the server doesn't need to store session data.
- Ideal for mobile apps and single-page applications (SPAs).

**Basic Authentication:**
- Clients send credentials (username and password) in the request header.
- Simple to implement but less secure, as credentials are sent in plain text (should be used over HTTPS).
- Not recommended for production unless used over HTTPS.

**JWT (JSON Web Token) Authentication:**
- Tokens are generated and signed by the server, containing user data and expiration.
- Stateless, scalable, and suitable for microservices architecture.
- Tokens are verified using a secret key or public/private key pair.
- Allows customization of token contents and expiration.

### Authentication Flow

1. **Client Request**: Client sends a request to the server with authentication credentials (e.g., token, username/password).
2. **Authentication Middleware**: DRF's authentication middleware intercepts the request and processes the authentication credentials according to the configured authentication classes.
3. **Authentication Validation**: The authentication classes verify the credentials. If valid, the request is authenticated and passed to the view or endpoint.
4. **View or Endpoint Logic**: The view or endpoint logic is executed, allowing access to the requested resource or performing the requested action.
5. **Response**: The server sends a response back to the client, indicating success or failure based on authentication and authorization checks.

### Best Practices

- Always use HTTPS to encrypt data transmitted during authentication.
- Choose appropriate authentication methods based on your application's requirements and security considerations.
- Implement rate limiting and throttling to prevent abuse and unauthorized access attempts.
- Regularly review and update authentication mechanisms to mitigate security risks.

---

## Implementing Authentication in DRF with JWT

### Installing SimpleJWT Package

```bash
pip install djangorestframework-simplejwt
```

### Updating settings.py

```python
INSTALLED_APPS = [
    ...,
    'rest_framework',
    'rest_framework_simplejwt',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
}
```

### Adding JWT Views

```python
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
```

### Updating URLs

```python
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
```

### How it Works

1. Users authenticate by sending their credentials (username and password) to the `/api/token/` endpoint.
2. The server validates the credentials and responds with an access token and a refresh token.
3. Users include the access token in the `Authorization` header for subsequent requests to authenticate themselves.
4. If the access token expires, users can use the refresh token to obtain a new access token without re-authenticating with their credentials.

---

## Authorization

Authorization determines what an authenticated user is allowed to do. DRF has several built-in mechanisms for this.

### Permissions Classes

DRF provides a set of permission classes that define the rules for accessing API endpoints:

- **IsAuthenticated**: Requires that the user is authenticated.
- **IsAuthenticatedOrReadOnly**: Allows authenticated users to perform any action, but restricts unauthenticated users to read-only access.
- **AllowAny**: Allows unrestricted access to the view.
- **Custom permission classes**: You can create custom permission classes tailored to your specific authorization requirements.

### Object-Level Permissions

DRF supports object-level permissions, allowing you to determine access to individual objects within a resource based on specific criteria. Implement object-level permissions by overriding the `has_object_permission` method in a custom permission class.

### Authentication vs. Authorization

- **Authentication** verifies the identity of a user (who you are).
- **Authorization** determines the user's level of access (what you can do).

### Role-Based Access Control (RBAC)

Role-based access control grants permissions based on user roles or groups. In Django, implement RBAC using custom permission classes that check the user's role or group membership.

### Token-Based Authentication

Tokens are obtained upon successful authentication and included in subsequent requests. DRF's token authentication scheme is a common choice for securing APIs.

### Granular Access Control

Implement custom permission logic based on business rules, user attributes, or any other relevant criteria.

### Third-Party Authorization Providers

Integrate with OAuth 2.0 or OpenID Connect for more advanced authentication and authorization workflows.

### Using Permission Classes

```python
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

class ExampleView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Your view logic here
        pass
```

---

## Rate Limiting

Rate limiting controls the number of requests a user can make to an API within a specified time period.

### Implementing Rate Limiting in DRF

**Step 1: Update settings.py**

```python
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.UserRateThrottle',
        'rest_framework.throttling.AnonRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'user': '100/day',  # Authenticated users can make 100 requests per day
        'anon': '10/hour',  # Unauthenticated users can make 10 requests per hour
    }
}
```

**Step 2: Apply Throttling to Views**

```python
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle
from rest_framework.views import APIView
from rest_framework.response import Response

class ExampleView(APIView):
    throttle_classes = [UserRateThrottle, AnonRateThrottle]

    def get(self, request):
        return Response({"message": "This is a rate-limited view."})
```

### Custom Throttling Classes

```python
from rest_framework.throttling import BaseThrottle

class CustomThrottle(BaseThrottle):
    def allow_request(self, request, view):
        # Implement custom logic to determine if the request should be allowed
        return True

    def wait(self):
        return None
```

---

## Throttling

Throttling controls the rate at which clients can make requests to an API.

### Implementing Throttling in DRF

**Step 1: Update settings.py**

```python
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.UserRateThrottle',
        'rest_framework.throttling.AnonRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'user': '100/day',
        'anon': '10/hour',
    }
}
```

**Step 2: Apply Throttling to Views**

```python
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle
from rest_framework.views import APIView
from rest_framework.response import Response

class ExampleView(APIView):
    throttle_classes = [UserRateThrottle, AnonRateThrottle]

    def get(self, request):
        return Response({"message": "This is a throttled view."})
```

### Scoped Throttling

Define different throttling rates for different parts of your API:

```python
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.ScopedRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'user': '100/day',
        'anon': '10/hour',
        'custom_scope': '5/minute',
    }
}

class ScopedThrottledView(APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'custom_scope'

    def get(self, request):
        return Response({"message": "Scoped throttling view."})
```

---

## CORS (Cross-Origin Resource Sharing)

CORS is a security feature that prevents web pages from making requests to a different domain than the one that served the web page.

### Implementing CORS in Django

**Step 1: Install django-cors-headers**

```bash
pip install django-cors-headers
```

**Step 2: Update settings.py**

```python
INSTALLED_APPS = [
    ...,
    'corsheaders',
    'rest_framework',
]

MIDDLEWARE = [
    ...,
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    ...,
]

# Allow all origins (not recommended for production)
CORS_ALLOW_ALL_ORIGINS = True

# Or specify allowed origins
CORS_ALLOWED_ORIGINS = [
    "https://example.com",
    "https://sub.example.com",
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'content-type',
    'authorization',
    'x-csrftoken',
    'x-requested-with',
]
```

---

## Using HTTPS

HTTPS encrypts data transmitted between the client and server.

### Implementing HTTPS in Django

**Step 1: Obtain an SSL Certificate** — From Let's Encrypt, Comodo, DigiCert, etc.

**Step 2: Configure Web Server (Nginx)**

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Step 3: Update Django Settings**

```python
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
```

---

## Input Validation and Sanitization

Input validation and sanitization prevent malicious data from reaching your API logic. DRF serializers handle both.

### Using Built-in Validators

```python
from rest_framework import serializers

class UserSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    age = serializers.IntegerField(min_value=18)

    def validate_username(self, value):
        if 'admin' in value.lower():
            raise serializers.ValidationError("Username cannot contain 'admin'.")
        return value
```

### Creating Custom Validators

```python
from rest_framework import serializers

def validate_even(value):
    if value % 2 != 0:
        raise serializers.ValidationError("This field must be an even number.")

class NumberSerializer(serializers.Serializer):
    number = serializers.IntegerField(validators=[validate_even])
```

### Sanitizing Input Data

```python
from rest_framework import serializers
import bleach

class CommentSerializer(serializers.Serializer):
    content = serializers.CharField()

    def validate_content(self, value):
        sanitized_content = bleach.clean(value, tags=[], attributes={}, styles=[], strip=True)
        return sanitized_content
```

### Using ModelSerializers

```python
from rest_framework import serializers
from myapp.models import User

class UserModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'age']

    def validate_username(self, value):
        if 'admin' in value.lower():
            raise serializers.ValidationError("Username cannot contain 'admin'.")
        return value
```

---

## Data Encryption

Data encryption protects sensitive data stored in your database.

### Using django-encrypted-model-fields

**Step 1: Install**

```bash
pip install django-encrypted-model-fields
```

**Step 2: Update settings.py**

```python
ENCRYPTED_FIELDS_KEY = 'your-secret-encryption-key'
```

**Step 3: Define Encrypted Fields in Models**

```python
from django.db import models
from encrypted_model_fields.fields import EncryptedCharField, EncryptedTextField

class UserProfile(models.Model):
    username = models.CharField(max_length=100)
    email = models.EmailField()
    ssn = EncryptedCharField(max_length=11)
    bio = EncryptedTextField()
```

### Using Django's Built-in Encryption (cryptography)

```python
from cryptography.fernet import Fernet

# Generate a key (do this once and store it securely)
key = Fernet.generate_key()
cipher_suite = Fernet(key)

# Encrypt data
plain_text = b"Sensitive data"
cipher_text = cipher_suite.encrypt(plain_text)

# Decrypt data
decrypted_text = cipher_suite.decrypt(cipher_text)
print(decrypted_text)  # Output: b'Sensitive data'
```
