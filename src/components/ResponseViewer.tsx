'use client';

import StrategyBlueprint from './StrategyBlueprint';

type Props = {
	data: any; // backend response.response shape
	onReset?: () => void;
};

export default function ResponseViewer({ data, onReset }: Props) {
	return <StrategyBlueprint data={data} onReset={onReset} />;
}


