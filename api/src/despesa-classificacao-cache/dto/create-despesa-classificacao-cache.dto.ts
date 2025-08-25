/*
model RollupDespesasMensais {
  parceiro_id String   @map("parceiro_id")
  ym          String   @map("ym")
  realized    Decimal  @default(0.0) @map("realized") @db.Decimal(12, 3)
  to_pay      Decimal  @default(0.0) @map("to_pay") @db.Decimal(12, 3)
  Parceiro    Parceiro @relation(fields: [parceiro_id], references: [publicId])

  @@id([parceiro_id, ym])
  @@map("rollup_despesas_mensais")
}
*/
export class CreateDespesaClassificacaoCacheDto {
  parceiro_id: number;
  ym: string;
  categoria_id: number;
  sub_categoria_id: number;
  realized: number;
  to_pay: number;
}
