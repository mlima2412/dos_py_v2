model Sale {
  id              String   @id @default(uuid())
  organizationId  String
  customerId      String?
  issueDate       DateTime
  currencyId      Int
  fx              Decimal  // cotação da emissão
  subtotal        Decimal   // 12,3
  discount        Decimal   // 12,3
  tax             Decimal   // 12,3 (se usar)
  total           Decimal   // 12,3 (subtotal - discount + tax)
  items           SaleItem[]
  receivable      AccountsReceivable?   // 1:1, se venda a prazo
  status          SaleStatus @default(OPEN) // OPEN | PAID | CANCELED
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}