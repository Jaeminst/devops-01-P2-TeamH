# Project 2 / Team H
지금까지 학습해온 과정들을 CI/CD하는 프로젝트다.

- [Github](https://github.com/Jaeminst/devops-01-P2-TeamH)
- [회고록(8주차-프로젝트)](https://velog.io/@jm1225/%ED%9A%8C%EA%B3%A0%EB%A1%9D-DevOps-8-10%EC%A3%BC%EC%B0%A8#%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8)

## 목표
- 주어진 API 문서를 참고하여, mongoDB를 이용한 백엔드 구현 및 API 서버를 개발합니다.

- Code변경 후 push하면 새로운 Docker image로 ECR에 Push하는 작업을 자동화 한다.

- 컨테이너 작업 정의에서 환경변수를 작성한다.

- 컨테이너들을 자동으로 배포해야 한다.
ECS - Fastify server application
ECS - MongoDB

- (사전에 제공되는) 프론트엔드를 Github action으로 빌드 및 배포를 자동화 합니다.

- 백엔드에 로드밸런서 및 HTTPS를 적용해야 합니다.

- CloudFront와 프론트엔드가 담긴 S3 버킷을 연결하고, HTTPS를 적용해야 합니다.

- Route 53으로 CloudFront와 로드밸런서를 각각 연결해야 합니다.

## 과정
<details>
  <summary>1. fastify server app 만들기</summary>
</br>
  <p>
  create-fastify-app package로 쉽게 fastify 앱을 만들수 있었다.
  </br>
  <code>$ npm install -g create-fastify-app</code>
  </br>
  <code>$ fastify-app generate:project -d devops-01-P2-TeamH</code>

  추가적으로 plugin을 설치해 주었다.
  <code>$ npm i fastify-cors</code>
  <code>$ npm i fastify-mongodb</code>
  (<code>--save</code> 옵션은 npm5이후 기본적용 옵션으로 생략하게 되었다.)
  </br>
  마지막으로 의존성 모듈을 모두 설치해 주었다.
  <code>$ npm i</code>
  </br>
주의사항: npm start명령으로 fastify 서버를 시작하면 로컬호스트 주소로 동작하므로 AWS에 컨테이너를 띄워도 접속할 수 없다. 따라서, package.json에서 -a 옵션으로 0.0.0.0 주소로 시작할 수 있도록 해야한다.
  </p>
</details>

---

2. ECR에 Docker image 수동 배포하기
Github action에서 Deploy to Amazone ECS 템플릿을 활용하여 ECS 배포하기 직전의 jobs만 사용하여 ECR에 배포하였다.
배포하기 위해 Dockerfile을 생성한다.
```
# devops-01-P2-TeamH/server/Dockerfile
FROM node:16-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD [ "npm", "start" ]
```

3. Github Action yml파일 수정
팀원모두 개인 yml파일을 만들어 name 및 branch 설정을 각자 이름으로 구분 해주었고.
```
# devops-01-P2-TeamH/.github/workflows/aws-jaemin.yml
name: Deploy to ECS by dev-jaeminst

on:
  push:
    branches:
      - dev-jaeminst
.
.
```
4. 각 branch에서 개인 AWS로 연결하는 yml을 셋팅하였다.
```
# devops-01-P2-TeamH/.github/workflows/aws-jaemin.yml
.
.
env:
  AWS_REGION: ap-northeast-2
  ECR_REPOSITORY: p2-teamh-jaemin

jobs:
  deploy:
    .
    .
    steps:
    .
    .
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v1
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID_JM }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY_JM }}
.
.
```

액세스 키와 시크릿 키를 팀원 각자의 KEY와 branch로 구분하였다.
![](https://velog.velcdn.com/images/jm1225/post/97197bed-74d6-4b17-bb02-a365adc27e70/image.png)

5. ECS에 작업을 생성할 때 ECR의 태그 latest를 찾아서 생성한다.
그래서 ECR에 배포할 때 태그를 latest로 해야하지만 실험적으로 깃허브 sha값을 태그하고 latest태그도 같이 해주면서 push해보았다.
실험은 성공적으로 진행되었다.
하지만, ECR에 있는 이미지만큼 과금이 되므로 latest이미지를 제외하고 모두 삭제해줘야 한다. 번외로 AWS 파이프라인을 이용한다면 최신 이미지 태그를 사용할 수도 있다.
(github.sha 태그 사용가능)
```
# devops-01-P2-TeamH/.github/workflows/aws-jaemin.yml
.
.
docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG ./server
docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
docker push --all-tags $ECR_REGISTRY/$ECR_REPOSITORY
```

6. API 작성
첫 프로젝트 때 API를 많이 해보아서, 이번 프로젝트는 CI/CD 구축이 핵심이므로 API는 최대한 간단하게 음식점 조회만 작성해 보았다.
fastify 패키지의 특징을 잘 살려서 routes안에 restaurants 엔드포인트 폴더를 만들고 그안에 index.js와 read.js를 만들었다.
![](https://velog.velcdn.com/images/jm1225/post/07ae1aad-946b-4497-9c59-c639d8d1a5db/image.png)

7. API 함수 작성
기본적인 API routes를 만들고나서 각 API에서 참조하는 함수 unit을 만들어 주었다.
![](https://velog.velcdn.com/images/jm1225/post/6e3f1723-8023-461c-a928-eaaba5fce7a2/image.png)

8. Commit 'Feat: api'를 github repository에 push하면 action이 동작하여 ECR에 자동으로 배포가 된다.
![](https://velog.velcdn.com/images/jm1225/post/3d41e3f8-c9df-4a79-b12d-2b8a061cac9a/image.png)
![](https://velog.velcdn.com/images/jm1225/post/6cfbc8aa-9bc0-4e41-b237-958cbf6e562a/image.png)

9. ECS에 자동으로 컨테이너를 올리기 위해, 먼저 작업 정의를 만든다.
![](https://velog.velcdn.com/images/jm1225/post/30b8bb42-5dd4-4697-9043-91a77e826cd4/image.png)

10. ECS 서비스에 등록할 ELB를 만들고 서비스를 생성한다.
NLB의 DNS로 접속하면 NLB의 리스너에 등록된 타겟으로 연결된다.
NLB -> [Listener](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-listeners.html) -> Target Group
MongoDB의 접속포트가 27017으로 ECS특성상 호스트와 컨테이너의 포트가 같아야 하므로 호스트 27017 포트로 접속하면 컨테이너 27017 포트로 연결된다.
그리고, 로드밸런서 DNS로 접속하는 포트는 별개로 지정가능하다.
로드밸런서 접속 포트를 80으로 열어두면 NLB의 DNS에 80포트로 연결가능하며 로드밸런서에 연결된 리스너의 타겟(ECS 서비스)으로 최종적으로 연결된다.
![](https://velog.velcdn.com/images/jm1225/post/9181d54d-5157-4449-ac3d-c68e3d6a2fe7/image.png)

11. mongodb server 작업정의
만들 때, 서버에 접근하여 초기 데이터나 사용자 등록을 위한 루트유저를 등록해줘야 한다.
![](https://velog.velcdn.com/images/jm1225/post/a2a8c34d-6c89-45e3-9496-072760fec108/image.png)

12. 백엔드 서버에 등록할 DB 서버의 서비스를 생성한다.
![](https://velog.velcdn.com/images/jm1225/post/a7d4ae29-9bed-4411-9e1e-93d1acbcf02a/image.png)
[서비스에서 컨테이너 인스턴스에 접근하는 보안그룹을 등록하게 되는데 여기서 사용하는 보안그룹의 포트는 컨테이너 호스트의 포트로 설정한다.](https://docs.aws.amazon.com/ko_kr/AmazonECS/latest/developerguide/get-set-up-for-amazon-ecs.html#create-a-base-security-group)
그 후, 로드밸런서를 등록하면 자동으로 이 서비스로 타겟이 연결된다.
따라서, 로드밸런서의 인바운드 규칙에 HTTPS를 연결한다면 로드밸런서 443포트로 접속 시 리스너를 따라 등록한 타겟의 서비스로 연결되는 원리이다.

13.  ECS 서비스에 등록할 ELB를 만들고 서비스를 생성한다 (2).
앞 서, 데이터베이스 서버의 네트워크 로드 밸런서를 만들었다면, 이번에는 애플리케이션 로드 밸런서를 만들어 backend 서버에 연결해주어야 한다.
![](https://velog.velcdn.com/images/jm1225/post/20fc3a3b-c54f-4568-8beb-84c45bf5ba8e/image.png)

13. backend server 작업정의할 때 환경변수로 database (TCP 연결) 등록해야 한다.
여기서 mongodb-ecs-dns는 위에서 등록한 NLB의 DNS주소이다.
![](https://velog.velcdn.com/images/jm1225/post/05affd86-bc54-4a25-9000-7baf9414c212/image.png)

13. ECR에 새로운 image:lastest가 올라가면 파이프라인으로 ECS에 새 버전의 컨테이너가 자동으로 배포되게 할 수 있다.
