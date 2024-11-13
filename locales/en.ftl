start_command = 
    .description = Start the bot
language_command = 
    .description = Change language

welcome = 👋🏻  Welcome!
language = 
    .select = Please, select your language
    .changed = Language successfully changed!

answer =
    .refreshed = Refreshed!

label = 
    .wallet = Wallet
    .refresh = Refresh
    .bscscan = 🌐 View on BSCScan
    .etherscan = 🌐 View on Etherscan
    .injective_explorer = 🌐 View on Injective Explorer
    .back = Back
    .withdraw_all = Withdraw all {$nativeCurrency}
    .withdraw_x = Withdraw x {$nativeCurrency}
    .withdraw_all = Withdraw all {$nativeCurrency}
    .withdraw_x = Withdraw x {$nativeCurrency}
    .deposit = Deposit
    .delete_wallet = Delete wallet
    .export_key = Export Private Key
    .cancel = Cancel
    .confirm = Confirm
    .import_key = Import Private Key
    .token_percentage = Set percent of token you want to sell
    .generate_wallet = Create Wallet
    .yes = Yes
    .no = No
    .buy_token = Buy Token
    .buy_btns_config = Buy Buttons Config
    .sell_btns_config = Sell Buttons Config
    .slippage_config = Slippage Config
    .buy_select_token = Buy { $tokenName }
    .buy_amount_token = Buy { $tokenAmount }
    .sell_select_token = Sell { $tokenName }
    .switch_chain = Switch Chain
    .ethereum_chain = ETH
    .switch_chain = Switch Chain
    .ethereum_chain = ETH
    .binance_chain = BNB
    .injective_chain = INJ
    .sell_manage = Manage Positions
    .refer_friend = Refer Friends
    .settings = Settings
    .help = Help
    .help = Help
    .buy = Buy
    .general_settings = My Settings
    .min_pos = Min Pos Value: {$value} {$nativeCurrency}
    .min_pos = Min Pos Value: {$value} {$nativeCurrency}
    .announcements = Announcements
    .min_pos = Min Pos Value: {$value} {$nativeCurrency}
    .auto_buy = Auto Buy
    .min_pos = Min Pos Value: {$value} {$nativeCurrency}
    .auto_buy = Auto Buy
    .enabled = Enabled
    .disabled = Disabled
    .trans_priority = Transaction Priority
    .low = Low
    .medium = Medium
    .high = High
    .close = Close
    .buy_more = Buy more
    .sell_btn = Sell {$value}% 
    .sell_x_btn_amount = Sell {$value} Amount
    .sell_x_btn_percentage = Sell {$value} %
    .sell_x_btn_percentage = Sell {$value} %
text =
    .welcome = 
    Your current balance is {$balance} {$nativeCurrency}, with no active positions.

    To begin trading, initiate a position by purchasing a token.

    Simply input the token's address, and a Buy dashboard will appear, allowing you to specify your desired purchase amount.

    For experienced traders, consider activating Auto Buy within your settings. With Auto Buy enabled, bot will promptly purchase any entered token with a predetermined amount you've set. This feature is disabled by default.

    Your Wallet: <code>{ $address }</code>

    .single_position = 
    <b>{$index})</b> <b>{$tokenName}</b>
    Profit: {$profit} 
    Value: $ {$tokenPrice}
    Mcap: $ {$mcap}


    .welcome_wallet_empty = 
    Your {$nativeCurrency} balance is currently empty. To begin trading, deposit some {$nativeCurrency} into your wallet at the following address:

    <code>{ $address }</code>

    After depositing, simply refresh the page to view your updated balance.

    To purchase a token, enter its address in the message tab.

    For further details about your wallet and to retrieve your private key, tap the wallet button below.
    
    To switch chains, select the tab and press /chain

    .welcome_chain_select = 
    <b>Create a new wallet.</b>

    Do you want to import an existing wallet or create a new one? 

    .deposit_details =
    <b>To deposit send {$nativeCurrency} to this address:</b>

    <code>{$address}</code>

    .deposit_details =
    <b>To deposit send {$nativeCurrency} to this address:</b>

    <code>{$address}</code>

    .wallet_detail = 
    <b>Wallet Details</b> 

    <b>Address</b>
    <code>{ $address }</code>

    <b>Current Balance</b>
    { $balance } { $nativeCurrency }

    Tap the address above to copy the address, and fund the wallet depositing { $nativeCurrency } into it.

    .withdraw_amount =
    <b>Select amount</b>

    Please enter amount to withdraw

    <b>Max available</b>
    <code>{ $balance }</code> { $nativeCurrency }

    .withdraw_address =
    <b>Withdraw { $nativeCurrency }</b>

    Reply with a withdrawal address.

    .invalid_address_valid_on_other_chain = 
    <b>Invalid address</b>

    This token address is valid on {$chain} chain. Please switch to {$chain} chain.

    Please enter valid address.

    .invalid_address =
    <b>Invalid address</b>

    Please enter valid address.

    .invalid_amount =
    <b>Invalid amount</b>

    Please enter valid amount

    .invalid_amount_percentage =
    <b>Invalid percentage</b>

    Please enter valid percentage
    
    .invalid_amount_too_high =
    <b>Invalid amount</b>

    Requested amount is larger than available balance
    ({ $amount } { $nativeCurrency } > { $balance } { $nativeCurrency })

    .confirm_transaction =
    <b>Confirm transaction</b>

    <b>Destination wallet</b>
    <code>{ $address }</code>

    <b>Amount</b>
    { $amount }

    <b>Estimated gas</b>
    { $gas }

    <i>WARNING: This action is irreversible!</i>

    .confirm_buy_transaction =
    <b>Confirm transaction</b>

    <b>Token contract address</b>
    <code>{ $address }</code>

    <b>Expected amount</b>
    { $amount }

    <b>Buy amount</b>
    { $currencyamt } { $nativeCurrency }

    <b>Estimated gas</b>
    { $gas }

    <i>WARNING: This action is irreversible!</i>

    .confirm_sell_transaction=
    <b>Confirm transaction</b>

    <b>Token contract address</b>
    <code>{ $address }</code>

    <b>Expected token amount</b>
    { $amount } { $sellTokenCurrency }

    <b>{ $currency } amount</b>
    { $currencyamt }

    <b>Estimated Gas</b>
    { $gas }

    <i>WARNING: This action is irreversible!</i>

    .transaction_success=
    Transaction submitted

    Your txn hash is
    <code>{ $hash }</code>
    <a href="{ $transactionLink }">{ $transactionLink }</a>

    <b>Balance</b>
    { $balance } { $nativeCurrency }

    .sending=
    <i>Sending transaction...</i>

    .transaction_fail=
    Transaction failed

    .delete_wallet=
    <b>Delete wallet</b>

    Are you sure you want to delete your wallet?

    <i>WARNING: This action is irreversible!</i>

    .create_wallet=
    <b>Create a new wallet</b>

    Do you want to import an existing wallet or create a new one?

    .import_key=
    <b>Import private key</b>

    .token_percentage=
    <b>Percent of token you want to sell</b>

    Reply with percentage of token you want to sell

    .token_value=
    <b>Amount of tokens you want to sell</b>

    Reply with amount of tokens you want to sell

    .invalid_key=
    <b>Invalid private key</b>

    Sorry, but supplied private key doesn't seem to be valid.

    .wallet_imported=
    <b>Wallet imported</b>

    <b>Address</b>
    <b><code>{ $address }</code></b>

    <b>Current balance</b>
    { $balance } { $nativeCurrency }

    Tap the address above to copy the address, and fund the wallet depositing { $nativeCurrency } into it.

    .deposit_native=
    <b>Deposit { $nativeCurrency }</b>

    To deposit { $nativeCurrency } send to
    <b><code>{ $address }</code></b>

    .wallet_created=
    <b>Wallet Created!</b>

    Your wallet address is
    <code>{ $address }</code>

    <b>Current balance</b>
    { $balance } { $nativeCurrency }

    Tap the address above to copy the address, and fund the wallet depositing { $nativeCurrency } into it.

    .confirm_otp=
    <b>Confirm OTP</b>

    Reply with to confirm
    <code>{ $otp }</code>

    .show_private_key=
    <b>Private key</b>

    Your Private Key is
    <code>{ $privateKey }</code>

    You can now i.e. import the key into a wallet like Metamask.

    .referral_code=
    <b>Referrals</b>

    Your reflink is <a href="{ $referLink }">{ $referLink }</a>

    .contract_address=
    <b>Enter Contract Address</b>

    Reply with the Contract Address

    .contract_detail=
    <b>Contract Details</b>

    <b>{ $tokenName }</b>
    <code>{ $contractAddress }</code>

    <b>Price</b>
    { $tokenPrice } USD

    <b>Market Cap</b>
    { $marketCap }

    <b>Wallet Balance</b>
    { $balance } { $nativeCurrency }

    To buy press one of the buttons below.

    .token_amount=
    <b>Buy { $tokenName }</b>

    Reply with the an amount of { $nativeCurrency } to buy

    .sell_token_amount=
    <b>Sell { $tokenName }</b>

    Reply with the amount of token you wish to sell

    .transaction_sent=
    <b>Transaction sent!</b>

    Your transaction Hash is
    { $tx }

    .select_chain=
    <b>Select Chain</b>

    .help_desc =
    Which tokens can I trade?

    .settings_desc = 
    <b>Settings</b>

    <b>GENERAL SETTINGS</b>
    Announcements: Occasional announcements. Tap to toggle.
    Minimum Position Value: Minimum position value to show in portfolio. Will hide tokens below this threshhold. Tap to edit.

    <b>AUTO BUY</b>
    Immediately buy when pasting token address. Tap to toggle.

    <b>SLIPPAGE CONFIG</b>
    Customize your slippage settings for buys and sells. Tap to edit.
    Max Price Impact is to protect against trades in extremely illiquid pools.

    <b>TRANSACTION PRIORITY</b>
    Increase your Transaction Priority to improve transaction speed. Select preset or tap to edit.

    .reply_pos_value =
    Reply with your new minimum {$nativeCurrency} value for positions to be displayed. Example: 0.01
    
    .reply_btn_buy_left_value =
    Reply with your value for buy left button value to be displayed. Example: 0.1

    .reply_btn_buy_left_value_set =
    Buy left button value set to {$value} {$nativeCurrency}

    .reply_btn_buy_right_value =
    Reply with your value for buy right button value to be displayed. Example: 0.5

    .reply_btn_buy_right_value_set =
    Buy right button value set to {$value} {$nativeCurrency}
    
    .reply_btn_sell_left_value =
    Reply with your value for sell left button value to be displayed. Example: 25 %

    .reply_btn_sell_left_value_set =
    Sell left button value set to {$value} %

    .reply_btn_sell_right_value =
    Reply with your value for sell right button value to be displayed. Example: 100 %

    .reply_btn_sell_right_value_set =
    Sell right button value set to {$value} %

    .reply_btn_slippage_buy =
    Reply with your value for buy slippage to be displayed. Example: 10 %

    .reply_btn_slippage_buy_set =
    Buy slippage value set to {$value} %

    .reply_btn_slippage_sell =
    Reply with your value for sell slippage to be displayed. Example: 10 %

    .reply_btn_slippage_sell_set =
    Sell slippage value set to {$value} %

    .set_pos_value =
    Minimum Position Value set to {$value} {$nativeCurrency}

    .reply_auto_amount =
    Reply with your new Auto Buy Amount in {$nativeCurrency}. Example: 0.5

    .set_auto_amount =
    Auto Buy Amount set to {$amount} {$nativeCurrency}.

    .reply_priority_amount =
    Reply with your new Transaction Priority Setting for sells in {$nativeCurrency}. Example: 0.0001 {$nativeCurrency}

    .set_priority_amount =
    Priority Fee set to ${$amount} {$nativeCurrency}.

    .position_manage=
    <b>Position management</b>
    Below are your open positions along with basic metrics. Tap a position to manage it.

    .position_manage_none=
    <b>Position management</b>
    <i>No open positions</i>

    .position_list=
    {$value} {$tokenName} ({$tokenPrice} {$nativeCurrency})

    .transaction_failed=
    Transaction failed.

    .position_detail=
    <b>{$tokenSymbol} / {$tokenName}</b>

    <code>{ $address }</code>

    <b>Profit</b> {$profit}
    <b>Value</b> {$value}
    <b>Mcap</b> {$mcap}
    
    <b>Net Profit</b> { $netProfit }
    <b>Balance</b> { $balance } { $tokenName }
    <b>Wallet Balance</b> { $walletBalance } { $nativeCurrency }

    .export_key =
    Are you sure you want to export your <b>Private key</b>? 
