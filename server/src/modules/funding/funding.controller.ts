import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles, RolesGuard } from '../../common';
import { UserRole } from '../users/types';
import {
  CreateContributionDto,
  CreateExpenseDto,
  CreateRoundDto,
  UpdateExpenseDto,
  UpdateRoundDto,
} from './dto';
import { FundingService } from './funding.service';

@Controller('funding')
export class FundingController {
  constructor(private readonly fundingService: FundingService) {}

  // ─── ROUNDS ─────────────────────────────────────────────

  @Get('rounds')
  findAllRounds() {
    return this.fundingService.findAllRounds();
  }

  @Post('rounds')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH, UserRole.PRESIDENT)
  createRound(@Body() dto: CreateRoundDto) {
    return this.fundingService.createRound(dto);
  }

  @Patch('rounds/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH, UserRole.PRESIDENT)
  updateRound(@Param('id') id: string, @Body() dto: UpdateRoundDto) {
    return this.fundingService.updateRound(id, dto);
  }

  @Delete('rounds/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH, UserRole.PRESIDENT)
  removeRound(@Param('id') id: string) {
    return this.fundingService.removeRound(id);
  }

  // ─── CONTRIBUTIONS ────────────────────────────────────────

  @Get('contributions')
  findContributions(@Query('roundId') roundId?: string) {
    return this.fundingService.findContributions(roundId);
  }

  @Post('contributions')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH, UserRole.PRESIDENT)
  createContribution(@Body() dto: CreateContributionDto) {
    return this.fundingService.createContribution(dto);
  }

  @Delete('contributions/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH, UserRole.PRESIDENT)
  removeContribution(@Param('id') id: string) {
    return this.fundingService.removeContribution(id);
  }

  // ─── EXPENSES ─────────────────────────────────────────────

  @Get('expenses')
  findAllExpenses() {
    return this.fundingService.findAllExpenses();
  }

  @Post('expenses')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH, UserRole.PRESIDENT)
  createExpense(@Body() dto: CreateExpenseDto) {
    return this.fundingService.createExpense(dto);
  }

  @Patch('expenses/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH, UserRole.PRESIDENT)
  updateExpense(@Param('id') id: string, @Body() dto: UpdateExpenseDto) {
    return this.fundingService.updateExpense(id, dto);
  }

  @Delete('expenses/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH, UserRole.PRESIDENT)
  removeExpense(@Param('id') id: string) {
    return this.fundingService.removeExpense(id);
  }

  // ─── SUMMARY ──────────────────────────────────────────────

  @Get('summary')
  getSummary() {
    return this.fundingService.getSummary();
  }
}
