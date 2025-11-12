#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Setting up Appwrite database using REST API...${NC}"
echo

# Load environment variables
ENV_FILE="$(dirname "$0")/../app/.env.local"
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Error: .env.local file not found at $ENV_FILE${NC}"
    exit 1
fi

# Source the env file
set -a
source "$ENV_FILE"
set +a

# Validate required variables
if [ -z "$APPWRITE_ENDPOINT" ] || [ -z "$APPWRITE_PROJECT_ID" ] || [ -z "$APPWRITE_API_KEY" ]; then
    echo -e "${RED}❌ Error: Missing required environment variables${NC}"
    echo "Required: APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY"
    exit 1
fi

DATABASE_ID="$APPWRITE_PROJECT_ID"

echo -e "${BLUE}📋 Configuration:${NC}"
echo "  Endpoint: $APPWRITE_ENDPOINT"
echo "  Project ID: $APPWRITE_PROJECT_ID"
echo "  Database ID: $DATABASE_ID"
echo

# Create database
echo -e "${BLUE}📦 Creating database...${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    "${APPWRITE_ENDPOINT}/v1/databases" \
    -H "Content-Type: application/json" \
    -H "X-Appwrite-Project: ${APPWRITE_PROJECT_ID}" \
    -H "X-Appwrite-Key: ${APPWRITE_API_KEY}" \
    -d "{\"databaseId\":\"${DATABASE_ID}\",\"name\":\"OOO Dashboard\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ]; then
    echo -e "  ${GREEN}✅ Database created successfully${NC}"
elif [ "$HTTP_CODE" = "409" ]; then
    echo -e "  ${YELLOW}ℹ️  Database already exists${NC}"
else
    echo -e "  ${RED}❌ Failed to create database (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
fi
echo

# Create profiles collection
echo -e "${BLUE}👤 Creating profiles collection...${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    "${APPWRITE_ENDPOINT}/v1/databases/${DATABASE_ID}/collections" \
    -H "Content-Type: application/json" \
    -H "X-Appwrite-Project: ${APPWRITE_PROJECT_ID}" \
    -H "X-Appwrite-Key: ${APPWRITE_API_KEY}" \
    -d "{\"collectionId\":\"profiles\",\"name\":\"User Profiles\",\"permissions\":[\"read(\\\"any\\\")\"]}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "201" ]; then
    echo -e "  ${GREEN}✅ Collection created${NC}"
elif [ "$HTTP_CODE" = "409" ]; then
    echo -e "  ${YELLOW}ℹ️  Collection already exists${NC}"
else
    echo -e "  ${RED}❌ Failed (HTTP $HTTP_CODE)${NC}"
fi

# Add attributes to profiles
echo -e "  ${BLUE}Adding attributes...${NC}"

# userId
curl -s -X POST "${APPWRITE_ENDPOINT}/v1/databases/${DATABASE_ID}/collections/profiles/attributes/string" \
    -H "Content-Type: application/json" \
    -H "X-Appwrite-Project: ${APPWRITE_PROJECT_ID}" \
    -H "X-Appwrite-Key: ${APPWRITE_API_KEY}" \
    -d '{"key":"userId","size":36,"required":true}' > /dev/null && echo -e "    ${GREEN}✅ userId${NC}" || echo -e "    ${YELLOW}ℹ️  userId exists${NC}"

# displayName
curl -s -X POST "${APPWRITE_ENDPOINT}/v1/databases/${DATABASE_ID}/collections/profiles/attributes/string" \
    -H "Content-Type: application/json" \
    -H "X-Appwrite-Project: ${APPWRITE_PROJECT_ID}" \
    -H "X-Appwrite-Key: ${APPWRITE_API_KEY}" \
    -d '{"key":"displayName","size":255,"required":true}' > /dev/null && echo -e "    ${GREEN}✅ displayName${NC}" || echo -e "    ${YELLOW}ℹ️  displayName exists${NC}"

# email
curl -s -X POST "${APPWRITE_ENDPOINT}/v1/databases/${DATABASE_ID}/collections/profiles/attributes/email" \
    -H "Content-Type: application/json" \
    -H "X-Appwrite-Project: ${APPWRITE_PROJECT_ID}" \
    -H "X-Appwrite-Key: ${APPWRITE_API_KEY}" \
    -d '{"key":"email","required":true}' > /dev/null && echo -e "    ${GREEN}✅ email${NC}" || echo -e "    ${YELLOW}ℹ️  email exists${NC}"

# timeZone
curl -s -X POST "${APPWRITE_ENDPOINT}/v1/databases/${DATABASE_ID}/collections/profiles/attributes/string" \
    -H "Content-Type: application/json" \
    -H "X-Appwrite-Project: ${APPWRITE_PROJECT_ID}" \
    -H "X-Appwrite-Key: ${APPWRITE_API_KEY}" \
    -d '{"key":"timeZone","size":100,"required":true,"default":"America/New_York"}' > /dev/null && echo -e "    ${GREEN}✅ timeZone${NC}" || echo -e "    ${YELLOW}ℹ️  timeZone exists${NC}"

# role
curl -s -X POST "${APPWRITE_ENDPOINT}/v1/databases/${DATABASE_ID}/collections/profiles/attributes/string" \
    -H "Content-Type: application/json" \
    -H "X-Appwrite-Project: ${APPWRITE_PROJECT_ID}" \
    -H "X-Appwrite-Key: ${APPWRITE_API_KEY}" \
    -d '{"key":"role","size":50,"required":true,"default":"user"}' > /dev/null && echo -e "    ${GREEN}✅ role${NC}" || echo -e "    ${YELLOW}ℹ️  role exists${NC}"

# Wait for attributes to be ready
echo -e "  ${BLUE}Waiting for attributes to be ready...${NC}"
sleep 3

# Create index
curl -s -X POST "${APPWRITE_ENDPOINT}/v1/databases/${DATABASE_ID}/collections/profiles/indexes" \
    -H "Content-Type: application/json" \
    -H "X-Appwrite-Project: ${APPWRITE_PROJECT_ID}" \
    -H "X-Appwrite-Key: ${APPWRITE_API_KEY}" \
    -d '{"key":"userId_index","type":"key","attributes":["userId"],"orders":["ASC"]}' > /dev/null && echo -e "    ${GREEN}✅ userId index${NC}" || echo -e "    ${YELLOW}ℹ️  userId index exists${NC}"

echo

# Create auditLogs collection
echo -e "${BLUE}📝 Creating auditLogs collection...${NC}"
curl -s -X POST "${APPWRITE_ENDPOINT}/v1/databases/${DATABASE_ID}/collections" \
    -H "Content-Type: application/json" \
    -H "X-Appwrite-Project: ${APPWRITE_PROJECT_ID}" \
    -H "X-Appwrite-Key: ${APPWRITE_API_KEY}" \
    -d '{"collectionId":"auditLogs","name":"Audit Logs","permissions":["read(\"any\")"]}' > /dev/null && echo -e "  ${GREEN}✅ Collection created${NC}" || echo -e "  ${YELLOW}ℹ️  Collection already exists${NC}"

echo -e "  ${BLUE}Adding attributes...${NC}"

curl -s -X POST "${APPWRITE_ENDPOINT}/v1/databases/${DATABASE_ID}/collections/auditLogs/attributes/string" \
    -H "Content-Type: application/json" \
    -H "X-Appwrite-Project: ${APPWRITE_PROJECT_ID}" \
    -H "X-Appwrite-Key: ${APPWRITE_API_KEY}" \
    -d '{"key":"userId","size":36,"required":true}' > /dev/null && echo -e "    ${GREEN}✅ userId${NC}" || echo -e "    ${YELLOW}ℹ️  userId exists${NC}"

curl -s -X POST "${APPWRITE_ENDPOINT}/v1/databases/${DATABASE_ID}/collections/auditLogs/attributes/string" \
    -H "Content-Type: application/json" \
    -H "X-Appwrite-Project: ${APPWRITE_PROJECT_ID}" \
    -H "X-Appwrite-Key: ${APPWRITE_API_KEY}" \
    -d '{"key":"action","size":100,"required":true}' > /dev/null && echo -e "    ${GREEN}✅ action${NC}" || echo -e "    ${YELLOW}ℹ️  action exists${NC}"

curl -s -X POST "${APPWRITE_ENDPOINT}/v1/databases/${DATABASE_ID}/collections/auditLogs/attributes/string" \
    -H "Content-Type: application/json" \
    -H "X-Appwrite-Project: ${APPWRITE_PROJECT_ID}" \
    -H "X-Appwrite-Key: ${APPWRITE_API_KEY}" \
    -d '{"key":"details","size":5000,"required":false}' > /dev/null && echo -e "    ${GREEN}✅ details${NC}" || echo -e "    ${YELLOW}ℹ️  details exists${NC}"

curl -s -X POST "${APPWRITE_ENDPOINT}/v1/databases/${DATABASE_ID}/collections/auditLogs/attributes/string" \
    -H "Content-Type: application/json" \
    -H "X-Appwrite-Project: ${APPWRITE_PROJECT_ID}" \
    -H "X-Appwrite-Key: ${APPWRITE_API_KEY}" \
    -d '{"key":"ipAddress","size":45,"required":false}' > /dev/null && echo -e "    ${GREEN}✅ ipAddress${NC}" || echo -e "    ${YELLOW}ℹ️  ipAddress exists${NC}"

curl -s -X POST "${APPWRITE_ENDPOINT}/v1/databases/${DATABASE_ID}/collections/auditLogs/attributes/datetime" \
    -H "Content-Type: application/json" \
    -H "X-Appwrite-Project: ${APPWRITE_PROJECT_ID}" \
    -H "X-Appwrite-Key: ${APPWRITE_API_KEY}" \
    -d '{"key":"timestamp","required":true}' > /dev/null && echo -e "    ${GREEN}✅ timestamp${NC}" || echo -e "    ${YELLOW}ℹ️  timestamp exists${NC}"

echo -e "  ${BLUE}Waiting for attributes...${NC}"
sleep 3

curl -s -X POST "${APPWRITE_ENDPOINT}/v1/databases/${DATABASE_ID}/collections/auditLogs/indexes" \
    -H "Content-Type: application/json" \
    -H "X-Appwrite-Project: ${APPWRITE_PROJECT_ID}" \
    -H "X-Appwrite-Key: ${APPWRITE_API_KEY}" \
    -d '{"key":"userId_timestamp","type":"key","attributes":["userId","timestamp"],"orders":["ASC","DESC"]}' > /dev/null && echo -e "    ${GREEN}✅ userId_timestamp index${NC}" || echo -e "    ${YELLOW}ℹ️  Index exists${NC}"

echo

# Create secrets collection
echo -e "${BLUE}🔐 Creating secrets collection...${NC}"
curl -s -X POST "${APPWRITE_ENDPOINT}/v1/databases/${DATABASE_ID}/collections" \
    -H "Content-Type: application/json" \
    -H "X-Appwrite-Project: ${APPWRITE_PROJECT_ID}" \
    -H "X-Appwrite-Key: ${APPWRITE_API_KEY}" \
    -d '{"collectionId":"secrets","name":"User Secrets","permissions":["read(\"any\")"]}' > /dev/null && echo -e "  ${GREEN}✅ Collection created${NC}" || echo -e "  ${YELLOW}ℹ️  Collection already exists${NC}"

echo -e "  ${BLUE}Adding attributes...${NC}"

curl -s -X POST "${APPWRITE_ENDPOINT}/v1/databases/${DATABASE_ID}/collections/secrets/attributes/string" \
    -H "Content-Type: application/json" \
    -H "X-Appwrite-Project: ${APPWRITE_PROJECT_ID}" \
    -H "X-Appwrite-Key: ${APPWRITE_API_KEY}" \
    -d '{"key":"userId","size":36,"required":true}' > /dev/null && echo -e "    ${GREEN}✅ userId${NC}" || echo -e "    ${YELLOW}ℹ️  userId exists${NC}"

curl -s -X POST "${APPWRITE_ENDPOINT}/v1/databases/${DATABASE_ID}/collections/secrets/attributes/string" \
    -H "Content-Type: application/json" \
    -H "X-Appwrite-Project: ${APPWRITE_PROJECT_ID}" \
    -H "X-Appwrite-Key: ${APPWRITE_API_KEY}" \
    -d '{"key":"encryptedRefreshToken","size":5000,"required":false}' > /dev/null && echo -e "    ${GREEN}✅ encryptedRefreshToken${NC}" || echo -e "    ${YELLOW}ℹ️  encryptedRefreshToken exists${NC}"

curl -s -X POST "${APPWRITE_ENDPOINT}/v1/databases/${DATABASE_ID}/collections/secrets/attributes/string" \
    -H "Content-Type: application/json" \
    -H "X-Appwrite-Project: ${APPWRITE_PROJECT_ID}" \
    -H "X-Appwrite-Key: ${APPWRITE_API_KEY}" \
    -d '{"key":"encryptedAccessToken","size":5000,"required":false}' > /dev/null && echo -e "    ${GREEN}✅ encryptedAccessToken${NC}" || echo -e "    ${YELLOW}ℹ️  encryptedAccessToken exists${NC}"

curl -s -X POST "${APPWRITE_ENDPOINT}/v1/databases/${DATABASE_ID}/collections/secrets/attributes/datetime" \
    -H "Content-Type: application/json" \
    -H "X-Appwrite-Project: ${APPWRITE_PROJECT_ID}" \
    -H "X-Appwrite-Key: ${APPWRITE_API_KEY}" \
    -d '{"key":"tokenExpiry","required":false}' > /dev/null && echo -e "    ${GREEN}✅ tokenExpiry${NC}" || echo -e "    ${YELLOW}ℹ️  tokenExpiry exists${NC}"

echo -e "  ${BLUE}Waiting for attributes...${NC}"
sleep 3

curl -s -X POST "${APPWRITE_ENDPOINT}/v1/databases/${DATABASE_ID}/collections/secrets/indexes" \
    -H "Content-Type: application/json" \
    -H "X-Appwrite-Project: ${APPWRITE_PROJECT_ID}" \
    -H "X-Appwrite-Key: ${APPWRITE_API_KEY}" \
    -d '{"key":"userId_index","type":"key","attributes":["userId"],"orders":["ASC"]}' > /dev/null && echo -e "    ${GREEN}✅ userId index${NC}" || echo -e "    ${YELLOW}ℹ️  userId index exists${NC}"

echo
echo -e "${GREEN}✨ Setup complete!${NC}"
echo -e "${BLUE}Your Appwrite database is ready at: ${APPWRITE_ENDPOINT}${NC}"
