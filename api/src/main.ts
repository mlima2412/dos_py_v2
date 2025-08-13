import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { PrismaService } from './prisma/prisma.service';
import { ensureSystemInitialized } from './usuarios/ipl';
import * as path from 'path'

import i18next from 'i18next'
import Backend from 'i18next-fs-backend'
import middleware from 'i18next-http-middleware'

async function bootstrap() {

  await i18next
    .use(Backend)
    .use(middleware.LanguageDetector)
    .init({
      fallbackLng: {
        'es-419': ['es'],  // redireciona espanhol latino-americano para o espanhol genérico
        'default': ['pt'], // fallback padrão
      },
      preload: ['pt', 'es'],
      //debug: true, // pré-carrega os idiomas
      backend: {
        loadPath: path.join(__dirname, '../i18n/{{lng}}/translation.json'),
      },
      ns: ['translation'],          // nome do arquivo
      defaultNS: 'translation',     // padrão (você pode omitir se quiser)
    })

  const app = await NestFactory.create(AppModule);

  app.use(middleware.handle(i18next))

  // Configuração de middlewares
  app.use(cookieParser());

  // Configuração de validação global
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        console.error('Erros de validação:', JSON.stringify(errors, null, 2));
        return new BadRequestException({
          message: 'Dados inválidos',
          errors,
        });
      },
    }),
  );

  // Configuração de CORS
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:5173'], // URLs do frontend
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language', 'x-parceiro-id'],
  });

  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('API dospy')
    .setDescription('Documentação da API de Usuários do sistema DOS-PY v2')
    .setVersion('2.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Endpoints de autenticação')

    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  app.getHttpAdapter().get('/api-json', (req, res) => {
    res.json(document);
  });

  const port = process.env.APP_PORT || 3000;
  await app.listen(port);

  // Inicializar sistema com PrismaService
  const prismaService = app.get(PrismaService);
  await ensureSystemInitialized(prismaService);

  console.log(
    `🚀 Aplicação rodando em modo ${process.env.NODE_ENV || 'development'}`,
  );
  console.log(
    `📚 Documentação Swagger disponível em: http://localhost:${port}/docs`,
  );

}
bootstrap();
