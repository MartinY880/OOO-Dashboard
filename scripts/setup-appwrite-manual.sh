#!/bin/bash

source app/.env.local

echo "Creating auditLogs collection..."
curl -X POST "https://appwrite.martinyousif.com/v1/databases/${APPWRITE_PROJECT_ID}/collections" \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: ${APPWRITE_PROJECT_ID}" \
  -H "X-Appwrite-Key: ${APPWRITE_API_KEY}" \
  -d '{"collectionId":"auditLogs","name":"Audit Logs","permissions":["read(\"any\")"]}' && echo

echo ""
echo "Creating secrets collection..."
curl -X POST "https://appwrite.martinyousif.com/v1/databases/${APPWRITE_PROJECT_ID}/collections" \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: ${APPWRITE_PROJECT_ID}" \
  -H "X-Appwrite-Key: ${APPWRITE_API_KEY}" \
  -d '{"collectionId":"secrets","name":"User Secrets","permissions":["read(\"any\")"]}' && echo

echo ""
echo "Adding attributes to profiles..."
curl -X POST "https://appwrite.martinyousif.com/v1/databases/${APPWRITE_PROJECT_ID}/collections/profiles/attributes/string" \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: ${APPWRITE_PROJECT_ID}" \
  -H "X-Appwrite-Key: ${APPWRITE_API_KEY}" \
  -d '{"key":"userId","size":36,"required":true}' && echo

curl -X POST "https://appwrite.martinyousif.com/v1/databases/${APPWRITE_PROJECT_ID}/collections/profiles/attributes/string" \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: ${APPWRITE_PROJECT_ID}" \
  -H "X-Appwrite-Key: ${APPWRITE_API_KEY}" \
  -d '{"key":"displayName","size":255,"required":true}' && echo

curl -X POST "https://appwrite.martinyousif.com/v1/databases/${APPWRITE_PROJECT_ID}/collections/profiles/attributes/email" \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: ${APPWRITE_PROJECT_ID}" \
  -H "X-Appwrite-Key: ${APPWRITE_API_KEY}" \
  -d '{"key":"email","required":true}' && echo

curl -X POST "https://appwrite.martinyousif.com/v1/databases/${APPWRITE_PROJECT_ID}/collections/profiles/attributes/string" \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: ${APPWRITE_PROJECT_ID}" \
  -H "X-Appwrite-Key: ${APPWRITE_API_KEY}" \
  -d '{"key":"timeZone","size":100,"required":true,"default":"America/New_York"}' && echo

curl -X POST "https://appwrite.martinyousif.com/v1/databases/${APPWRITE_PROJECT_ID}/collections/profiles/attributes/string" \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: ${APPWRITE_PROJECT_ID}" \
  -H "X-Appwrite-Key: ${APPWRITE_API_KEY}" \
  -d '{"key":"role","size":50,"required":true,"default":"user"}' && echo

echo ""
echo "Waiting for profiles attributes to be ready..."
sleep 5

echo ""
echo "Creating profiles index..."
curl -X POST "https://appwrite.martinyousif.com/v1/databases/${APPWRITE_PROJECT_ID}/collections/profiles/indexes" \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: ${APPWRITE_PROJECT_ID}" \
  -H "X-Appwrite-Key: ${APPWRITE_API_KEY}" \
  -d '{"key":"userId_index","type":"key","attributes":["userId"],"orders":["ASC"]}' && echo

echo ""
echo "Adding attributes to auditLogs..."
curl -X POST "https://appwrite.martinyousif.com/v1/databases/${APPWRITE_PROJECT_ID}/collections/auditLogs/attributes/string" \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: ${APPWRITE_PROJECT_ID}" \
  -H "X-Appwrite-Key: ${APPWRITE_API_KEY}" \
  -d '{"key":"userId","size":36,"required":true}' && echo

curl -X POST "https://appwrite.martinyousif.com/v1/databases/${APPWRITE_PROJECT_ID}/collections/auditLogs/attributes/string" \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: ${APPWRITE_PROJECT_ID}" \
  -H "X-Appwrite-Key: ${APPWRITE_API_KEY}" \
  -d '{"key":"action","size":100,"required":true}' && echo

curl -X POST "https://appwrite.martinyousif.com/v1/databases/${APPWRITE_PROJECT_ID}/collections/auditLogs/attributes/string" \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: ${APPWRITE_PROJECT_ID}" \
  -H "X-Appwrite-Key: ${APPWRITE_API_KEY}" \
  -d '{"key":"details","size":5000,"required":false}' && echo

curl -X POST "https://appwrite.martinyousif.com/v1/databases/${APPWRITE_PROJECT_ID}/collections/auditLogs/attributes/string" \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: ${APPWRITE_PROJECT_ID}" \
  -H "X-Appwrite-Key: ${APPWRITE_API_KEY}" \
  -d '{"key":"ipAddress","size":45,"required":false}' && echo

curl -X POST "https://appwrite.martinyousif.com/v1/databases/${APPWRITE_PROJECT_ID}/collections/auditLogs/attributes/datetime" \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: ${APPWRITE_PROJECT_ID}" \
  -H "X-Appwrite-Key: ${APPWRITE_API_KEY}" \
  -d '{"key":"timestamp","required":true}' && echo

echo ""
echo "Waiting for auditLogs attributes..."
sleep 5

echo ""
echo "Creating auditLogs index..."
curl -X POST "https://appwrite.martinyousif.com/v1/databases/${APPWRITE_PROJECT_ID}/collections/auditLogs/indexes" \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: ${APPWRITE_PROJECT_ID}" \
  -H "X-Appwrite-Key: ${APPWRITE_API_KEY}" \
  -d '{"key":"userId_timestamp","type":"key","attributes":["userId","timestamp"],"orders":["ASC","DESC"]}' && echo

echo ""
echo "Adding attributes to secrets..."
curl -X POST "https://appwrite.martinyousif.com/v1/databases/${APPWRITE_PROJECT_ID}/collections/secrets/attributes/string" \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: ${APPWRITE_PROJECT_ID}" \
  -H "X-Appwrite-Key: ${APPWRITE_API_KEY}" \
  -d '{"key":"userId","size":36,"required":true}' && echo

curl -X POST "https://appwrite.martinyousif.com/v1/databases/${APPWRITE_PROJECT_ID}/collections/secrets/attributes/string" \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: ${APPWRITE_PROJECT_ID}" \
  -H "X-Appwrite-Key: ${APPWRITE_API_KEY}" \
  -d '{"key":"encryptedRefreshToken","size":5000,"required":false}' && echo

curl -X POST "https://appwrite.martinyousif.com/v1/databases/${APPWRITE_PROJECT_ID}/collections/secrets/attributes/string" \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: ${APPWRITE_PROJECT_ID}" \
  -H "X-Appwrite-Key: ${APPWRITE_API_KEY}" \
  -d '{"key":"encryptedAccessToken","size":5000,"required":false}' && echo

curl -X POST "https://appwrite.martinyousif.com/v1/databases/${APPWRITE_PROJECT_ID}/collections/secrets/attributes/datetime" \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: ${APPWRITE_PROJECT_ID}" \
  -H "X-Appwrite-Key: ${APPWRITE_API_KEY}" \
  -d '{"key":"tokenExpiry","required":false}' && echo

echo ""
echo "Waiting for secrets attributes..."
sleep 5

echo ""
echo "Creating secrets index..."
curl -X POST "https://appwrite.martinyousif.com/v1/databases/${APPWRITE_PROJECT_ID}/collections/secrets/indexes" \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: ${APPWRITE_PROJECT_ID}" \
  -H "X-Appwrite-Key: ${APPWRITE_API_KEY}" \
  -d '{"key":"userId_index","type":"key","attributes":["userId"],"orders":["ASC"]}' && echo

echo ""
echo "✅ Setup complete!"
