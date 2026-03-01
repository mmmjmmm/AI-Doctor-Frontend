interface DisclaimerTopBarProps {
  text?: string;
}

export default function DisclaimerTopBar({ text = "AI回答仅供参考，请勿用于医疗诊断或就医决策" }: DisclaimerTopBarProps) {
  return (
    <div className="bg-gray-50 px-4 py-2 text-center shrink-0 border-b border-gray-100/50">
      <p className="text-[12px] text-gray-400 leading-tight transform scale-95">
        {text}
      </p>
    </div>
  );
}
