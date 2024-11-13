start_command = 
    .description = เริ่มต้นใช้งานบอท
language_command = 
    .description = เปลี่ยนภาษา

welcome = 👋🏻  ยินดีต้อนรับ!
language = 
    .select = โปรดเลือกภาษาที่่ต้องการ
    .changed = เปลี่ยนภาษาสำเร็จ

answer =
    .refreshed = รีเฟรชเรียบร้อย

label = 
    .wallet = กระเป๋า
    .refresh = รีเฟรช
    .bscscan = 🌐 ดูข้อมูลบน BSCScan
    .etherscan = 🌐 ดูข้อมูลบน Etherscan
    .back = ย้อนกลับ
    .withdraw_all = ถอน {$nativeCurrency} ทั้งหมด
    .withdraw_x = ถอน {$nativeCurrency} จำนวน X
    .deposit = ฝาก
    .delete_wallet = ลบกระเป๋า
    .export_key = แสดง Private Key
    .cancel = ยกเลิก
    .confirm = ยืนยัน
    .import_key = นำเข้า Private Key
    .token_percentage = กำหนดเปอร์เซ็นต์ของเหรียญทั้งหมดที่จะขาย
    .generate_wallet = สร้างกระเป๋า
    .yes = ใช่
    .no = ไม่
    .buy_token = ซื้อ Token
    .buy_btns_config = ตั้งค่าปุ่มซื้อ
    .sell_btns_config = ตั้งค่าปุ่มขาย
    .slippage_config = ตั้งค่า Slippage
    .buy_select_token = ซื้อ { $tokenName }
    .buy_amount_token = ซื้อ { $tokenAmount }
    .sell_select_token = ขาย { $tokenName }
    .switch_chain = เปลี่ยนเชน
    .ethereum_chain = ETH
    .binance_chain = BNB
    .sell_manage = จัดการ Positions
    .refer_friend = แนะนำเพื่อน
    .settings = ตั้งค่า
    .help = ช่วยเหลือ
    .buy = ซื้อ
    .general_settings = การตั้งค่าของฉัน
    .min_pos = จำนวน Position ขั้นต่ำ: {$value} {$nativeCurrency}
    .announcements = ประกาศ
    .min_pos = จำนวน Position ขั้นต่ำ: {$value} {$nativeCurrency}
    .auto_buy = Auto Buy
    .enabled = เปิดใช่งาน
    .disabled = ปิดใช้งาน
    .trans_priority = --- TRANSACTION PRIORITY ---
    .very_high = สูงมาก
    .high = สูง
    .medium = ปานกลาง
    .close = ปิด
    .buy_more = ซื้อเพิ่ม
    .sell_btn = ขาย {$value}% 
    .sell_x_btn_amount = ขายจำนวน {$value}
    .sell_x_btn_percentage = ขาย {$value} %
text =
    .welcome = 
    Balance ในปัจจุบันของคุณคือ {$balance} {$nativeCurrency},ไม่มี Position ที่เปิดอยู่.

    เพื่อเริ่มการเทรด, เปิด Position โดยการซื้อ Token.

    เมื่อคุณใส่ Contract Address ของ Token,จะมี Dashboard การซื้อขึ้นมาเพื่อให้คุณได้ซื้อตามจำนวนที่คุณต้องการ.

    สำหรับนักเทรดที่มีประสบการณ์, แนะนำให้เปิด Auto Buy ในตั้งค่า.เมื่อคุณเปิด Auto Buy ตัวบอทจะซื้อ Token ตามที่คุณใส่ Contract Address โดยอัตโนมัติตามจำนวนที่คุณตั้งไว้.

    กระเป๋าของคุณ: <code>{ $address }</code>

    .single_position = 
    <b>{$index})</b> <b>{$tokenName}</b>
    กำไร: {$profit} 
    มูลค่า: $ {$tokenPrice}
    Market Cap: $ {$mcap}


    .welcome_wallet_empty = 
    คุณไม่มี {$nativeCurrency} อยู่ในกระเป๋า.เพื่อเริ่มการเทรด ทำการฝาก {$nativeCurrency} เข้าสู่ Address นี้:

    <code>{ $address }</code>

    หลังจากการฝาก ทำการรีเฟรชเพื่ออัพเดท Balance ของคุณ.

    เพื่อเริ่มซื้อ Token, โปรดใส่ address ในช่องข้อความ.

    For further details about your wallet and to retrieve your private key, tap the wallet button below.
    
    หากต้องการเปลี่ยนเชน, โปรดกดที่ tab และเลือก /chain

    .welcome_chain_select = 
    <b>Create a new wallet.</b>

    คุณต้องการที่จะนำเข้ากระเป๋า หรือ สร้างกระเป๋าใหม่? 

    .deposit_details =
    <b>ส่ง {$nativeCurrency} มาที่ Address นี้เพื่อฝากเงิน:</b>

    <code>{$address}</code>

    .wallet_detail = 
    <b>ข้อมูลกระเป๋า</b> 

    <b>Address</b>
    <code>{ $address }</code>

    <b>Balance ปัจจุบัน</b>
    { $balance } { $nativeCurrency }

    คลิ๊กที่ address ข้างบนเพื่อคัดลอก, และเติมเงินโดยการส่ง { $nativeCurrency } เข้าไป.

    .withdraw_amount =
    <b>เลือกจำนวน</b>

    โปรดใส่จำนวนที่ต้องการถอน

    <b>Max available</b>
    <code>{ $balance }</code> { $nativeCurrency }

    .withdraw_address =
    <b>ถอน { $nativeCurrency }</b>

    ตอบกลับด้วย Address ปลายทางที่ต้องการถอน.

    .invalid_address =
    <b>Address ไม่ถูกต้อง</b>

    โปรดใส่ Address ที่ถูกต้อง.

    .invalid_amount =
    <b>จำนวนไม่ถูกต้อง</b>

    โปรดใส่จำนวนที่ถูกต้อง

    .invalid_amount_percentage =
    <b>เปอร์เซ็นต์ไม่ถูกต้อง</b>

    โปรดใส่เปอร์เซ็นต์ที่ถูกต้อง
    
    .invalid_amount_too_high =
    <b>จำนวนไม่ถูกต้อง</b>

    จำนวนที่เรียกขอมากกว่าจำนวนที่มีอยู่
    ({ $amount } { $nativeCurrency } > { $balance } { $nativeCurrency })

    .confirm_transaction =
    <b>ยืนยันธุรกรรม</b>

    <b>กระเป๋าปลายทาง</b>
    <code>{ $address }</code>

    <b>จำนวย</b>
    { $amount }

    <b>Gas โดยประมาณ</b>
    { $gas }

    <i>คำเตือน: การกระทำนี้ไม่สามารถย้อนกลับได้! </i>

    .confirm_buy_transaction =
    <b>ยืนยันธุรกรรม</b>

    <b>Contract Address โทเคน</b>
    <code>{ $address }</code>

    <b>จำนวนที่คาดว่าจะได้รับ</b>
    { $amount }

    <b>จำนวนที่ซื้อ</b>
    { $currencyamt }

    <b>Gas โดยประมาณ</b>
    { $gas }

    <i>คำเตือน: การกระทำนี้ไม่สามารถย้อนกลับได้!</i>

    .confirm_sell_transaction =
    <b>ยืนยันธุรกรรม</b>

    <b>Contract Address โทเคน</b>
    <code>{ $address }</code>

    <b>จำนวนเหรียญที่คาดการ</b>
    { $amount }

    <b>จำนวน { $currency }</b>
    { $currencyamt }

    <b>Gas โดยประมาณ</b>
    { $gas }

    <i>คำเตือน: การกระทำนี้ไม่สามารถย้อนกลับได้!</i>

    .transaction_success=
    ธุรกรรมถูกยืนยัน

    txn hash ของคุณคือ
    <code>{ $hash }</code>
    <a href="{ $transactionLink }">{ $transactionLink }</a>

    <b>Balance</b>
    { $balance } { $nativeCurrency }

    .sending=
    <i>กำลังส่งธุรกรรม....</i>

    .transaction_fail=
    ธุรกรรมล้มเหลว

    .delete_wallet=
    <b>ลบกระเป๋า</b>

    คุณแน่ใจหรือไม่ว่าต้องการลบกระเป๋า

    <i>คำเตือน: การกระทำนี้ไม่สามารถย้อนกลับได้!</i>

    .create_wallet=
    <b>สร้างกระเป่าใหม่</b>

    คุณต้องการนำเข้า Private Key หรือสร้างกระเป๋าใหม่

    .import_key=
    <b>นำเข้า private key</b>

    .token_percentage=
    <b>เปอร์เซ็นต์ของเหรียญที่้ต้องการขาย</b>

    ตอบกลับด้วยเปอร์เซ็นต์ของเหรียญที่้คุณต้องการขาย

    .token_value=
    <b>จำนวนของเหรียญที่้ต้องการขาย</b>

    ตอบกลับด้วยจำนวนของเหรียญที่้คุณต้องการขาย

    .invalid_key=
    <b>Private Key ไม่ถูกต้อง</b>

    ขออภัย, Private Key ที่กรอกมาไม่ถูกต้อง

    .wallet_imported=
    <b>Wallet นำเข้าสำเร็จ</b>

    <b>Address</b>
    <b><code>{ $address }</code></b>

    <b>Current balance</b>
    { $balance } { $nativeCurrency }

    คลิ๊กที่ address ข้างบนเพื่อคัดลอก, และเติมเงินโดยการส่ง { $nativeCurrency } เข้าไป.

    .deposit_native=
    <b>ฝาก { $nativeCurrency }</b>

    ในการฝากเงิน ส่ง { $nativeCurrency } ไปที่
    <b><code>{ $address }</code></b>

    .wallet_created=
    <b>สร้าง Wallet สำเร็จ</b>

    Wallet Address ของคุณคือ
    <code>{ $address }</code>

    <b>Current balance</b>
    { $balance } { $nativeCurrency }

    คลิ๊กที่ address ข้างบนเพื่อคัดลอก, และเติมเงินโดยการส่ง { $nativeCurrency } เข้าไป.

    .confirm_otp=
    <b>ยืนยัน OTP</b>

    ตอบกลับเพื่อยืนยัน OTP
    <code>{ $otp }</code>

    .show_private_key=
    <b>Private key</b>

    Private Key ของคุณคือ
    <code>{ $privateKey }</code>

    You can now i.e. import the key into a wallet like Metamask.

    .referral_code=
    <b>Referrals</b>

    Referral Link ของคุณคือ <a href="{ $referLink }">{ $referLink }</a>

    .contract_address=
    <b>ใส่ Contract Address</b>

    ตอบกลับด้วย Contract Address

    .contract_detail=
    <b>Contract Details</b>

    <b>{ $tokenName }</b>
    <code>{ $contractAddress }</code>

    <b>Price</b>
    { $tokenPrice } { $nativeCurrency }

    <b>Market Cap</b>
    { $marketCap }

    <b>Wallet Balance</b>
    { $balance } { $nativeCurrency }

    กดปุ่มด้านล่างเพื่อซื้อ

    .token_amount=
    <b>ซื้อ { $tokenName }</b>

    ตอบกลับด้วยจำนวน { $nativeCurrency } เพื่อซื้อ

    .sell_token_amount=
    <b>ขาย { $tokenName }</b>

    ตอบกลับด้วยจำนวนโทเคนที่ต้องการขาย

    .transaction_sent=
    <b>ธุรกรรมถูกส่งแล้ว!</b>

    Tx Hash ของคุณคือ
    { $tx }

    .select_chain=
    <b>เลือก Chain</b>

    .help_desc =
    ฉันสามารถเทรด Token อะไรบ้าง?

    .settings_desc = 
    <b>Settings</b>

    <b>GENERAL SETTINGS</b>
    Announcements: แสดงประกาศ. กดเพื่อเปิด/ปิด.
    Minimum Position Value: จำนวนมูลค่า Position ขั้นต่ำที่จะแสดงใน Portfolio. Position ของโทเคนที่มูลค่าต่ำกว่าจำนวนนี้จะถูกซ่อนไว้. กดเพื่อแก้ไข.

    <b>AUTO BUY</b>
    ซื้อทันทีเมื่อวาง Contract Address. กดเพื่อเปิด/ปิด.

    <b>SLIPPAGE CONFIG</b>
    เปลี่ยนการตั้งค่า Slippage ในการซื้อขาย. กดเพื่อแก้ไข.
    Max Price Impact มีไว้เพื่อป้องกันการเทรดบน Pool ที่ LP ต่ำมาก.

    <b>TRANSACTION PRIORITY</b>
    เพิ่ม Transaction Priority เพื่อเพิ่มความเร็วของธุรกรรม. เลือก preset หรือกดเพื่อแก้ไข.

    .reply_pos_value =
    ตอบกลับด้วยจำนวน {$nativeCurrency} ขั้นต่ำสำหรับการแสดง Position. ตัวอย่าง: 0.01
    
    .reply_btn_buy_left_value =
    ตอบกลับด้วยจำนวนของปุ่มซื้อด้านซ้ายที่ต้องการจะให้แสดง. ตัวอย่าง: 0.1

    .reply_btn_buy_left_value_set =
    ปุ่มซื้อด้านซ้ายได้ถูกตั้งค่าเป็นจำนวน {$value} {$nativeCurrency}

    .reply_btn_buy_right_value =
    ตอบกลับด้วยจำนวนของปุ่มซื้อด้านขวาที่ต้องการจะให้แสดง. ตัวอย่าง: 0.5

    .reply_btn_buy_right_value_set =
     ปุ่มซื้อด้านขวาได้ถูกตั้งค่าเป็นจำนวน {$value} {$nativeCurrency}
    
    .reply_btn_sell_left_value =
    ตอบกลับด้วยจำนวนของปุ่มขายด้านซ้ายที่ต้องการจะให้แสดง. ตัวอย่าง: 25 %

    .reply_btn_sell_left_value_set =
    ปุ่มขายด้านซ้ายได้ถูกตั้งค่าเป็นจำนวน {$value} %

    .reply_btn_sell_right_value =
    ตอบกลับด้วยจำนวนของปุ่มขายด้านขวาที่ต้องการจะให้แสดง. ตัวอย่าง: 100 %

    .reply_btn_sell_right_value_set =
    ปุ่มขายด้านขวาได้ถูกตั้งค่าเป็นจำนวน {$value} %

    .reply_btn_slippage_buy =
    ตอบกลับด้วยจำนวน Slippage ซื้อที่ต้องการจะให้แสดง. ตัวอย่าง: 10 %

    .reply_btn_slippage_buy_set =
    ปุ่ม Slippage ซื้อได้ถูกตั้งค่าเป็นจำนวน {$value} %

    .reply_btn_slippage_sell =
    ตอบกลับด้วยจำนวน Slippage ขายที่ต้องการจะให้แสดง. ตัวอย่าง: 10 %

    .reply_btn_slippage_sell_set =
    ปุ่ม Slippage ขายได้ถูกตั้งค่าเป็นจำนวน {$value} %

    .set_pos_value =
    มูลค่า Position ขั้นต่ำได้ถูกตั้งเป็น ${$value}

    .reply_auto_amount =
    ตอบกลับด้วยจำนวน {$nativeCurrency} ที่คุณต้องการ Auto Buy. ตัวอย่าง: 0.5

    .set_auto_amount =
    จำนวน Auto Buy ถูกตั้งเป็น {$amount} {$nativeCurrency}.

    .reply_priority_amount =
    ตอบกลับด้วยจำนวน Priority Fee ในการขายที่คุณต้องการในหน่วย {$nativeCurrency}. ตัวอย่าง: 0.0001 {$nativeCurrency}

    .set_priority_amount =
    Priority Fee ถูกตั้งเป็น ${$amount} {$nativeCurrency}.

    .position_manage=
    <b>Position management</b>
    ข้างล่างคือ Open Position ของคุณพร้อมข้อมูลเบื้องต้น. กดที่ position เพื่อจัดการ.

    .position_manage_none=
    <b>Position management</b>
    <i>ไม่มี Open Position</i>

    .position_list=
    {$value} {$tokenName} ({$tokenPrice} {$nativeCurrency})

    .transaction_failed=
    ธุรกรรมล้มเหลว.

    .position_detail=
    <b>{$tokenSymbol} / {$tokenName} / {$address}</b>

    <b>Profit</b> {$profit}
    <b>Value</b> {$value}
    <b>Mcap</b> {$mcap}
    
    <b>Net Profit</b> { $netProfit }
    <b>Balance</b> { $balance } { $tokenName }
    <b>Wallet Balance</b> { $walletBalance } { $nativeCurrency }

    .export_key =
    คุณต้องการจะส่งออก <b>Private key</b>? 
