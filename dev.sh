#!/bin/bash

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 함수들
print_header() {
    echo -e "${CYAN}================================${NC}"
    echo -e "${CYAN}    Investica Dev Manager${NC}"
    echo -e "${CYAN}================================${NC}"
}

print_menu() {
    echo -e "\n${YELLOW}메뉴를 선택하세요:${NC}"
    echo -e "${GREEN}1)${NC} 백엔드 문서 생성 (build:swagger + build:sdk)"
    echo -e "${GREEN}2)${NC} 백엔드 개발 모드 실행"
    echo -e "${GREEN}3)${NC} 프론트엔드 개발 모드 실행"
    echo -e "${GREEN}4)${NC} 전체 개발 환경 실행 (백엔드 + 프론트엔드)"
    echo -e "${GREEN}5)${NC} 백엔드 문서 서버 실행"
    echo -e "${RED}0)${NC} 종료"
    echo -e "\n${PURPLE}선택: ${NC}"
}

build_backend_docs() {
    echo -e "\n${BLUE}백엔드 문서를 생성합니다...${NC}"
    cd server
    
    echo -e "${YELLOW}Swagger 문서 생성 중...${NC}"
    npm run build:swagger
    
    echo -e "${YELLOW}SDK 생성 중...${NC}"
    npm run build:sdk
    
    echo -e "${GREEN}백엔드 문서 생성 완료!${NC}"
    cd ..
}

start_backend_dev() {
    echo -e "\n${BLUE}백엔드 개발 모드를 시작합니다...${NC}"
    cd server
    npm run start:dev
}

start_frontend_dev() {
    echo -e "\n${BLUE}프론트엔드 개발 모드를 시작합니다...${NC}"
    cd client
    npm run dev
}

start_backend_swagger() {
    echo -e "\n${BLUE}백엔드 문서 서버를 시작합니다...${NC}"
    cd server
    npm run start:swagger
}

start_all_dev() {
    echo -e "\n${BLUE}전체 개발 환경을 시작합니다...${NC}"
    
    # 성공/실패 상태 변수들
    DOCS_SUCCESS=false
    BACKEND_SUCCESS=false
    SWAGGER_SUCCESS=false
    FRONTEND_SUCCESS=false
    
    # 백엔드 문서 생성
    echo -e "${CYAN}1. 백엔드 문서 생성 중...${NC}"
    if build_backend_docs; then
        DOCS_SUCCESS=true
        echo -e "${GREEN}✅ 문서 생성 성공${NC}"
    else
        echo -e "${RED}❌ 문서 생성 실패${NC}"
        echo -e "${YELLOW}계속하려면 Enter를 누르세요...${NC}"
        read
    fi
    
    # 백그라운드에서 백엔드 실행
    echo -e "${CYAN}2. 백엔드 개발 서버 시작 중...${NC}"
    cd server
    npm run start:dev &
    BACKEND_PID=$!
    if kill -0 $BACKEND_PID 2>/dev/null; then
        BACKEND_SUCCESS=true
        echo -e "${GREEN}✅ 백엔드 서버 시작 성공 (PID: $BACKEND_PID)${NC}"
    else
        echo -e "${RED}❌ 백엔드 서버 시작 실패${NC}"
        echo -e "${YELLOW}계속하려면 Enter를 누르세요...${NC}"
        read
    fi
    cd ..
    
    # 백그라운드에서 문서 서버 실행
    echo -e "${CYAN}3. 백엔드 문서 서버 시작 중...${NC}"
    cd server
    npm run start:swagger &
    SWAGGER_PID=$!
    if kill -0 $SWAGGER_PID 2>/dev/null; then
        SWAGGER_SUCCESS=true
        echo -e "${GREEN}✅ 문서 서버 시작 성공 (PID: $SWAGGER_PID)${NC}"
    else
        echo -e "${RED}❌ 문서 서버 시작 실패${NC}"
        echo -e "${YELLOW}계속하려면 Enter를 누르세요...${NC}"
        read
    fi
    cd ..
    
    sleep 2
    
    # 프론트엔드 실행
    echo -e "${CYAN}4. 프론트엔드 개발 서버 시작 중...${NC}"
    cd client
    npm run dev &
    FRONTEND_PID=$!
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        FRONTEND_SUCCESS=true
        echo -e "${GREEN}✅ 프론트엔드 서버 시작 성공 (PID: $FRONTEND_PID)${NC}"
    else
        echo -e "${RED}❌ 프론트엔드 서버 시작 실패${NC}"
        echo -e "${YELLOW}계속하려면 Enter를 누르세요...${NC}"
        read
    fi
    cd ..
    
    echo -e "${GREEN}모든 서비스가 시작되었습니다!${NC}"
    echo -e "${YELLOW}실제 포트 확인 중...${NC}"
    
    # 실제 포트 확인
    sleep 3
    echo -e "\n${CYAN}실제 실행 중인 서비스:${NC}"
    
    # 포트 확인 함수
    check_service_port() {
        local service_name=$1
        local pid_var=$2
        local success_var=$3
        local default_port=$4
        local path_suffix=$5
        
        if [ "${!success_var}" = true ] && kill -0 ${!pid_var} 2>/dev/null; then
            local port=$(lsof -p ${!pid_var} | grep LISTEN | awk '{print $9}' | cut -d: -f2 | head -1)
            if [ ! -z "$port" ]; then
                echo -e "${GREEN}✅ $service_name: http://localhost:$port$path_suffix (PID: ${!pid_var})${NC}"
            else
                echo -e "${YELLOW}⚠️ $service_name: 실행 중이지만 포트 확인 중... (PID: ${!pid_var})${NC}"
            fi
        else
            echo -e "${RED}❌ $service_name: 시작 실패${NC}"
        fi
    }
    
    # 각 서비스 포트 확인
    check_service_port "백엔드 개발 서버" "BACKEND_PID" "BACKEND_SUCCESS" "3000" ""
    check_service_port "백엔드 문서 서버" "SWAGGER_PID" "SWAGGER_SUCCESS" "37810" "/api-docs"
    check_service_port "프론트엔드 개발 서버" "FRONTEND_PID" "FRONTEND_SUCCESS" "5173" ""
    
    echo -e "\n${YELLOW}종료하려면 Ctrl+C를 누르세요...${NC}"
    
    wait
}

# 메인 루프
while true; do
    clear
    print_header
    print_menu
    
    read -r choice
    
    case $choice in
        1)
            build_backend_docs
            echo -e "\n${GREEN}문서 생성이 완료되었습니다.${NC}"
            read -p "계속하려면 Enter를 누르세요..."
            ;;
        2)
            start_backend_dev
            ;;
        3)
            start_frontend_dev
            ;;
        4)
            start_all_dev
            ;;
        5)
            start_backend_swagger
            ;;
        0)
            echo -e "\n${GREEN}프로그램을 종료합니다.${NC}"
            exit 0
            ;;
        *)
            echo -e "\n${RED}잘못된 선택입니다. 다시 시도해주세요.${NC}"
            sleep 2
            ;;
    esac
done
