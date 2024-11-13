-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'DELETED');

-- CreateEnum
CREATE TYPE "Chain" AS ENUM ('ETHEREUM', 'BINANCE', 'INJECTIVE', 'TRON');

-- CreateEnum
CREATE TYPE "Action" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'BUY', 'SELL');

-- CreateTable
CREATE TABLE "users" (
    "user_id" BIGINT NOT NULL,
    "language_code" TEXT,
    "chain" "Chain" NOT NULL,
    "public_address" TEXT,
    "encrypted_private_key" BYTEA,
    "referral_code" TEXT,
    "referred_by" TEXT,
    "settings" JSONB,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "otp" (
    "otp" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL
);

-- CreateTable
CREATE TABLE "address_hash_map" (
    "address" TEXT NOT NULL,
    "hash" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "interactions" (
    "interaction_id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "user_message" TEXT NOT NULL,
    "bot_reply" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "time_stamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interactions_pkey" PRIMARY KEY ("interaction_id")
);

-- CreateTable
CREATE TABLE "positions" (
    "position_id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "token" TEXT NOT NULL,
    "size" DOUBLE PRECISION NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "positions_pkey" PRIMARY KEY ("position_id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "txn_id" TEXT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "from" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "action_type" "Action" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "token_amount" TEXT NOT NULL,
    "native_amount" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "chain" "Chain" NOT NULL,
    "token_id" BIGINT NOT NULL
);

-- CreateTable
CREATE TABLE "wallet_histories" (
    "history_id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "wallet_address" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "encrypted_private_key" BYTEA NOT NULL,

    CONSTRAINT "wallet_histories_pkey" PRIMARY KEY ("history_id")
);

-- CreateTable
CREATE TABLE "referrals" (
    "referral_id" BIGSERIAL NOT NULL,
    "referred_id" BIGINT NOT NULL,
    "referred_by_id" BIGINT NOT NULL,
    "referred_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("referral_id")
);

-- CreateTable
CREATE TABLE "referral_payouts" (
    "referral_payout_id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "referred_id" BIGINT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "created_on" TIMESTAMP(3) NOT NULL,
    "for_month" BOOLEAN NOT NULL,
    "txn_id" TEXT NOT NULL,

    CONSTRAINT "referral_payouts_pkey" PRIMARY KEY ("referral_payout_id")
);

-- CreateTable
CREATE TABLE "tokens" (
    "token_id" BIGSERIAL NOT NULL,
    "chain" "Chain" NOT NULL,
    "address" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "decimals" INTEGER NOT NULL,
    "max_supply" DECIMAL(40,0) NOT NULL,

    CONSTRAINT "tokens_pkey" PRIMARY KEY ("token_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_user_id_key" ON "users"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "otp_user_id_key" ON "otp"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "address_hash_map_address_key" ON "address_hash_map"("address");

-- CreateIndex
CREATE UNIQUE INDEX "address_hash_map_hash_key" ON "address_hash_map"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_txn_id_key" ON "transactions"("txn_id");

-- CreateIndex
CREATE UNIQUE INDEX "referrals_referred_by_id_key" ON "referrals"("referred_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "referral_payouts_txn_id_key" ON "referral_payouts"("txn_id");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_chain_address_key" ON "tokens"("chain", "address");

-- AddForeignKey
ALTER TABLE "otp" ADD CONSTRAINT "otp_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "positions" ADD CONSTRAINT "positions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_token_id_fkey" FOREIGN KEY ("token_id") REFERENCES "tokens"("token_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_histories" ADD CONSTRAINT "wallet_histories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
