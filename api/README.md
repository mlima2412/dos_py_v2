# With-NestJs | API

## Getting Started

## Start Stop the containers

```bash
 docker compose up -d
 docker compose -p api stop
```

## Start Stop individual services

```bash
docker compose -p api stop db
docker compose -p api stop redis

docker compose -p api start db
docker compose -p api start redis

```

## See indivual logs

```bash
docker compose logs -f redis
docker compose logs -f db
```

First, run the development server:

```bash
pnpm run dev
```

By default, your server will run at [http://localhost:3000](http://localhost:3000). You can use your favorite API platform like [Insomnia](https://insomnia.rest/) or [Postman](https://www.postman.com/) to test your APIs

You can start editing the demo **APIs** by modifying the existing services like ClientesService, ParceirosService, etc.

### ⚠️ Note about build

If you plan to only build this app. Please make sure you've built the packages first.

## Learn More

To learn more about NestJs, take a look at the following resources:

- [Official Documentation](https://docs.nestjs.com) - A progressive Node.js framework for building efficient, reliable and scalable server-side applications.
- [Official NestJS Courses](https://courses.nestjs.com) - Learn everything you need to master NestJS and tackle modern backend applications at any scale.
- [GitHub Repo](https://github.com/nestjs/nest)
