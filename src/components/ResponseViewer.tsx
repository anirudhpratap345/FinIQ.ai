'use client';

import StrategyBlueprint from './StrategyBlueprint';

type Props = {
	data: any; // backend response.response shape
	onReset?: () => void;
	/** Original form inputs for duplicate scenario feature */
	formInputs?: any;
	/** Callback when user wants to duplicate and tweak the scenario */
	onDuplicate?: (inputs: any) => void;
};

export default function ResponseViewer({ data, onReset, formInputs, onDuplicate }: Props) {
	return (
		<StrategyBlueprint 
			data={data} 
			onReset={onReset}
			formInputs={formInputs}
			onDuplicate={onDuplicate}
		/>
	);
}


