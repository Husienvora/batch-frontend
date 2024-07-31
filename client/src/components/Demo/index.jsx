import useEth from "../../contexts/EthContext/useEth";

import ContractBtns from "./ContractBtns";

import NoticeWrongNetwork from "./NoticeWrongNetwork";

function Demo() {
  const { state } = useEth();

  const {
    state: { contract, accounts },
  } = useEth();
  const demo = (
    <>
      <div className="contract-container">
        <ContractBtns />
      </div>
    </>
  );

  return (
    <div className="demo">{!state.sdk ? <NoticeWrongNetwork /> : demo}</div>
  );
}

export default Demo;
