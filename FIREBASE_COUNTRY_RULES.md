# Firebase rules required for global country management

Merge these match blocks into your existing rules; do not replace unrelated rules.

## Firestore

Add inside your existing `match /databases/{database}/documents` block:

```javascript
function isGaboAdmin() {
  return request.auth != null &&
    (request.auth.token.email == 'taher616380@gmail.com' ||
     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
}

match /country_registry/{countryCode} {
  allow read: if true;
  allow create, update, delete: if isGaboAdmin();
}

match /country_registry_meta/{documentId} {
  allow read: if true;
  allow create, update, delete: if isGaboAdmin();
}
```

## Firebase Storage

Add this match block inside your existing `service firebase.storage { match /b/{bucket}/o { ... } }` block:

```javascript
match /country-flags/{fileName} {
  allow read: if true;
  allow write: if request.auth != null &&
    (request.auth.token.email == 'taher616380@gmail.com' ||
     firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.isAdmin == true) &&
    request.resource.size < 1 * 1024 * 1024 &&
    request.resource.contentType.matches('image/.*');
}
```

The country manager uploads optimized JPG images to `country-flags/{countryCode}.jpg`. Keep your existing rules for all other paths.
