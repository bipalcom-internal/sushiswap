import { Amount, Native, Type } from '@sushiswap/currency'
import { Skeleton } from '@sushiswap/ui/future/components/skeleton'
import { FC, memo, useCallback } from 'react'

import { CurrencyInputProps } from './CurrencyInput'
import { JSBI } from '@sushiswap/math'
import { WalletIcon } from '@sushiswap/ui/future/components/icons'

type BalancePanel = Pick<CurrencyInputProps, 'chainId' | 'onChange' | 'currency' | 'disableMaxButton' | 'loading'> & {
  id?: string
  account: string | undefined
  balance: Amount<Type> | undefined
}

const MIN_NATIVE_CURRENCY_FOR_GAS: JSBI = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(16)) // .01 ETH

export const BalancePanel: FC<BalancePanel> = memo(function BalancePanel({
  id,
  balance,
  onChange,
  disableMaxButton,
  loading,
}) {
  const [big, portion] = (balance ? `${balance?.toSignificant(6)}` : '0.00').split('.')

  const onClick = useCallback(() => {
    if (onChange && balance?.greaterThan(0)) {
      if (balance.currency.isNative && balance.greaterThan(MIN_NATIVE_CURRENCY_FOR_GAS)) {
        const hundred = Amount.fromRawAmount(Native.onChain(balance.currency.chainId), MIN_NATIVE_CURRENCY_FOR_GAS)
        onChange(balance.subtract(hundred).toFixed())
      } else {
        onChange(balance?.greaterThan(0) ? balance.toFixed() : '')
      }
    }
  }, [balance, onChange])

  if (loading) {
    return (
      <div className="w-[60px] flex items-center">
        <Skeleton.Text fontSize="text-lg" className="w-full" />
      </div>
    )
  }

  return (
    <button
      data-testid={`${id}-balance-button`}
      type="button"
      onClick={onClick}
      className="font-medium flex gap-1.5 items-center py-1 text-blue hover:text-blue-600 active:text-blue-700 dark:text-slate-400 hover:dark:text-slate-300 px-2 rounded-md"
      disabled={disableMaxButton}
    >
      <WalletIcon width={18} height={18} />
      <span className="text-lg">
        {big}.<span className="text-sm font-semibold">{portion ?? '00'}</span>
      </span>
    </button>
  )
})
