#!/bin/bash
# Test script for Developer Control Plane

set -e

echo "🧪 Testing Developer Control Plane"
echo "=================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
    local name=$1
    local url=$2
    local expected_code=${3:-200}

    echo -n "Testing $name... "

    if response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null); then
        if [ "$response" -eq "$expected_code" ]; then
            echo -e "${GREEN}✓${NC} (HTTP $response)"
            return 0
        else
            echo -e "${YELLOW}⚠${NC} (HTTP $response, expected $expected_code)"
            return 1
        fi
    else
        echo -e "${RED}✗${NC} (Connection failed)"
        return 1
    fi
}

# Check if services are running
echo "1. Checking service status..."
if docker compose ps | grep -q "Up"; then
    echo -e "${GREEN}✓${NC} Services are running"
else
    echo -e "${YELLOW}⚠${NC} Some services may not be running"
    docker compose ps
fi
echo ""

# Wait for services to be ready
echo "2. Waiting for services to be ready..."
sleep 5
echo ""

# Test endpoints
echo "3. Testing API endpoints..."
test_endpoint "Gateway Health" "http://localhost:8000/health"
test_endpoint "Gateway Dashboard" "http://localhost:8000/"
test_endpoint "Score API Health" "http://localhost:8081/health"
test_endpoint "Score Webhooks Health" "http://localhost:8082/health"
test_endpoint "Plugin Manager Health" "http://localhost:8083/health"
echo ""

# Test Score API functionality
echo "4. Testing Score API functionality..."

# List specs (should be empty initially)
echo -n "Listing Score specs... "
if curl -s http://localhost:8081/api/v1/specs | grep -q "specs"; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
fi

# Create a test spec
echo -n "Creating test Score spec... "
response=$(curl -s -X POST http://localhost:8081/api/v1/specs \
    -H "Content-Type: application/json" \
    -d '{
        "apiVersion": "score.dev/v1b1",
        "metadata": {
            "name": "test-app"
        },
        "containers": {
            "test-app": {
                "image": "nginx:latest"
            }
        }
    }' 2>/dev/null)

if echo "$response" | grep -q "test-app"; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC} Response: $response"
fi

# Get the created spec
echo -n "Retrieving test Score spec... "
if curl -s http://localhost:8081/api/v1/specs/test-app | grep -q "test-app"; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
fi

# Trigger pipeline
echo -n "Triggering pipeline... "
pipeline_response=$(curl -s -X POST http://localhost:8082/webhooks/pipeline/trigger \
    -H "Content-Type: application/json" \
    -d '{
        "workload": "test-app",
        "action": "deploy"
    }' 2>/dev/null)

if echo "$pipeline_response" | grep -q "Pipeline triggered"; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
fi

echo ""

# Test Plugin Manager
echo "5. Testing Plugin Manager..."

echo -n "Listing plugins... "
if curl -s http://localhost:8083/api/v1/plugins | grep -q "plugins"; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
fi

echo -n "Listing extension points... "
if curl -s http://localhost:8083/api/v1/extension-points | grep -q "extensionPoints"; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
fi

echo ""

# Test API Gateway routing
echo "6. Testing API Gateway routing..."

echo -n "Score API via Gateway... "
if curl -s http://localhost:8000/api/score/specs | grep -q "specs"; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
fi

echo -n "Plugin Manager via Gateway... "
if curl -s http://localhost:8000/api/plugins/plugins | grep -q "plugins"; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
fi

echo ""

# Test database connectivity
echo "7. Testing database connectivity..."
echo -n "PostgreSQL connection... "
if docker compose exec -T postgres psql -U backstage -d backstage -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
fi

echo -n "Score database... "
if docker compose exec -T postgres psql -U backstage -d score -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
fi

echo ""

# Summary
echo "=================================="
echo "✅ Testing complete!"
echo ""
echo "Access the platform:"
echo "  - API Gateway: http://localhost:8000"
echo "  - Backstage: http://localhost:7007"
echo "  - Eclipse Che: http://localhost:8080"
echo "  - Score API: http://localhost:8081"
echo "  - Plugin Manager: http://localhost:8083"
