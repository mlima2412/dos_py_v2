import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { UpdateCurrencyDto } from './dto/update-currency.dto';
import { Currency } from './entities/currency.entity';
import { uuidv7 } from 'uuidv7';

@Injectable()
export class CurrencyService {
  constructor(private prisma: PrismaService) {}

  async create(createCurrencyDto: CreateCurrencyDto): Promise<Currency> {
    // Verificar se o código ISO já existe
    const existingCurrency = await this.prisma.currency.findUnique({
      where: { isoCode: createCurrencyDto.isoCode },
    });

    if (existingCurrency) {
      throw new ConflictException(
        `Moeda com código ISO '${createCurrencyDto.isoCode}' já existe`,
      );
    }

    // Criar a entidade Currency para validação
    const currencyEntity = Currency.create({
      ...createCurrencyDto,
      publicId: uuidv7(),
    });

    // Salvar no banco de dados
    const savedCurrency = await this.prisma.currency.create({
      data: {
        publicId: currencyEntity.publicId,
        nome: currencyEntity.nome,
        prefixo: currencyEntity.prefixo,
        isoCode: currencyEntity.isoCode,
        precision: currencyEntity.precision,
        locale: currencyEntity.locale,
        defaultRate: currencyEntity.defaultRate,
        ativo: currencyEntity.ativo,
      },
    });

    return new Currency({
      ...savedCurrency,
      defaultRate: Number(savedCurrency.defaultRate),
    });
  }

  async findAll(ativo?: boolean): Promise<Currency[]> {
    const currencies = await this.prisma.currency.findMany({
      where: ativo !== undefined ? { ativo } : undefined,
      orderBy: { nome: 'asc' },
    });

    return currencies.map(
      currency =>
        new Currency({
          ...currency,
          defaultRate: Number(currency.defaultRate),
        }),
    );
  }

  async findAllActive(): Promise<Currency[]> {
    return this.findAll(true);
  }

  async findOne(publicId: string): Promise<Currency> {
    const currency = await this.prisma.currency.findUnique({
      where: { publicId },
    });

    if (!currency) {
      throw new NotFoundException(`Moeda com ID '${publicId}' não encontrada`);
    }

    return new Currency({
      ...currency,
      defaultRate: Number(currency.defaultRate),
    });
  }

  async findByIsoCode(isoCode: string): Promise<Currency | null> {
    const currency = await this.prisma.currency.findUnique({
      where: { isoCode },
    });

    return currency
      ? new Currency({
          ...currency,
          defaultRate: Number(currency.defaultRate),
        })
      : null;
  }

  async update(
    publicId: string,
    updateCurrencyDto: UpdateCurrencyDto,
  ): Promise<Currency> {
    // Verificar se a moeda existe
    const existingCurrency = await this.prisma.currency.findUnique({
      where: { publicId },
    });

    if (!existingCurrency) {
      throw new NotFoundException(`Moeda com ID '${publicId}' não encontrada`);
    }

    // Se está atualizando o código ISO, verificar se não existe outro com o mesmo código
    if (
      updateCurrencyDto.isoCode &&
      updateCurrencyDto.isoCode !== existingCurrency.isoCode
    ) {
      const duplicateCurrency = await this.prisma.currency.findUnique({
        where: { isoCode: updateCurrencyDto.isoCode },
      });

      if (duplicateCurrency) {
        throw new ConflictException(
          `Moeda com código ISO '${updateCurrencyDto.isoCode}' já existe`,
        );
      }
    }

    // Criar entidade atualizada para validação
    const updatedData = {
      ...existingCurrency,
      ...updateCurrencyDto,
    };

    const currencyEntity = new Currency({
      ...updatedData,
      defaultRate: Number(updatedData.defaultRate),
    });
    currencyEntity.validateBusinessRules();

    // Atualizar no banco de dados
    const updatedCurrency = await this.prisma.currency.update({
      where: { publicId },
      data: {
        nome: currencyEntity.nome,
        prefixo: currencyEntity.prefixo,
        isoCode: currencyEntity.isoCode,
        precision: currencyEntity.precision,
        locale: currencyEntity.locale,
        defaultRate: currencyEntity.defaultRate,
        ativo: currencyEntity.ativo,
      },
    });

    return new Currency({
      ...updatedCurrency,
      defaultRate: Number(updatedCurrency.defaultRate),
    });
  }

  async activate(publicId: string): Promise<Currency> {
    const currency = await this.prisma.currency.findUnique({
      where: { publicId },
    });

    if (!currency) {
      throw new NotFoundException(`Moeda com ID '${publicId}' não encontrada`);
    }

    const updatedCurrency = await this.prisma.currency.update({
      where: { publicId },
      data: { ativo: true },
    });

    return new Currency({
      ...updatedCurrency,
      defaultRate: Number(updatedCurrency.defaultRate),
    });
  }

  async deactivate(publicId: string): Promise<Currency> {
    const currency = await this.prisma.currency.findUnique({
      where: { publicId },
    });

    if (!currency) {
      throw new NotFoundException(`Moeda com ID '${publicId}' não encontrada`);
    }

    const updatedCurrency = await this.prisma.currency.update({
      where: { publicId },
      data: { ativo: false },
    });

    return new Currency({
      ...updatedCurrency,
      defaultRate: Number(updatedCurrency.defaultRate),
    });
  }

  async remove(publicId: string): Promise<void> {
    const currency = await this.prisma.currency.findUnique({
      where: { publicId },
      include: { parceiros: true },
    });

    if (!currency) {
      throw new NotFoundException(`Moeda com ID '${publicId}' não encontrada`);
    }

    // Verificar se a moeda está sendo utilizada por algum parceiro
    if (currency.parceiros && currency.parceiros.length > 0) {
      throw new ConflictException(
        'Moeda está sendo utilizada por parceiros e não pode ser removida',
      );
    }

    await this.prisma.currency.delete({
      where: { publicId },
    });
  }

  async count(ativo?: boolean): Promise<number> {
    return this.prisma.currency.count({
      where: ativo !== undefined ? { ativo } : undefined,
    });
  }
}
