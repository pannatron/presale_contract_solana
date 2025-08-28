use anchor_lang::prelude::*;

declare_id!("FrLwXqLQ1oQ5feJTx7qj9nJZjiLxtsi7pEMaWir7tvcB");

#[program]
pub mod presale_contract_solana {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
