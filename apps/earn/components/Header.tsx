import { useAutoConnect } from '@sushiswap/wagmi'
import React, { FC } from 'react'

import { SUPPORTED_CHAIN_IDS } from '../config'

import { GlobalNav, NavLink } from '@sushiswap/ui/future/components/GlobalNav'
import { HeaderNetworkSelector } from '@sushiswap/wagmi/future/components/HeaderNetworkSelector'
import { UserProfile } from '@sushiswap/wagmi/future/components/UserProfile'
import { AppearOnMount } from '@sushiswap/ui/future/components/animation'

export const Header: FC = () => {
  const { isAutoConnecting } = useAutoConnect()

  return (
    <GlobalNav
      rightElement={
        isAutoConnecting ? (
          <></>
        ) : (
          <AppearOnMount className="flex gap-2">
            <HeaderNetworkSelector networks={SUPPORTED_CHAIN_IDS} />
            <UserProfile networks={SUPPORTED_CHAIN_IDS} />
          </AppearOnMount>
        )
      }
    >
      <NavLink title="Swap" href="https://sushi.com/swap" />
    </GlobalNav>
  )
}
