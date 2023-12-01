import { Injectable } from '@nestjs/common';
import { CreateStockOutputDto } from './dto/create-stock-output.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotFoundError } from 'src/errors';

@Injectable()
export class StockOutputsService {
  constructor(private prismaService: PrismaService) {}

  async create(createStockOutputDto: CreateStockOutputDto) {
    const product = await this.prismaService.stockInput.findUnique({
      where: { id: createStockOutputDto.productId },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    if (product.quantity <= 0) {
      throw Error('Product Out of Stock');
    }

    if (createStockOutputDto.quantity > product.quantity) {
      throw Error('Insufficient stock quantity');
    }

    const result = await this.prismaService.$transaction([
      this.prismaService.stockInput.create({
        data: {
          productId: createStockOutputDto.productId,
          quantity: createStockOutputDto.quantity,
          date: createStockOutputDto.date,
        },
      }),
      this.prismaService.product.update({
        where: { id: createStockOutputDto.productId },
        data: {
          quantity: {
            decrement: createStockOutputDto.quantity,
          },
        },
      }),
    ]);

    return result[0];
  }

  findAll() {
    return this.prismaService.stockOutput.findMany();
  }

  async findOne(id: number) {
    try {
      return await this.prismaService.stockOutput.findUniqueOrThrow({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundError(`Stock Input with ID ${id} not found`);
      }
      throw error;
    }
  }
}
