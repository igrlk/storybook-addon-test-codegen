import { useState } from 'react';

interface FormValues {
	textInput: string;
	numberInput: string;
	emailInput: string;
	passwordInput: string;
	dateInput: string;
	rangeInput: string;
	textarea: string;
	singleSelect: string;
	multipleSelect: string[];
	checkbox: boolean;
	radio: string;
	ariaCheckbox: boolean;
	ariaRadio: string;
	ariaSwitch: boolean;
}

const defaultValues: FormValues = {
	textInput: '',
	numberInput: '',
	emailInput: '',
	passwordInput: '',
	dateInput: '',
	rangeInput: '50',
	textarea: '',
	singleSelect: '1',
	multipleSelect: [],
	checkbox: false,
	radio: '',
	ariaCheckbox: false,
	ariaRadio: '',
	ariaSwitch: false,
};

export const ManyElements = () => {
	const [values, setValues] = useState<FormValues>(defaultValues);
	const [submitted, setSubmitted] = useState(false);
	const [fieldsetDisabled, setFieldsetDisabled] = useState(false);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitted(true);
	};

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>,
	) => {
		const target = e.target;
		const value =
			target.type === 'checkbox'
				? (target as HTMLInputElement).checked
				: target.value;
		const name = target.name;

		setValues((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const options = Array.from(e.target.selectedOptions);
		const values = options.map((option) => option.value);

		setValues((prev) => ({
			...prev,
			multipleSelect: values,
		}));
	};

	const handleAriaCheckboxChange = (name: string) => {
		setValues((prev) => ({
			...prev,
			[name]: !prev[name as keyof FormValues],
		}));
	};

	const handleAriaRadioChange = (value: string) => {
		setValues((prev) => ({
			...prev,
			ariaRadio: value,
		}));
	};

	if (submitted) {
		return (
			<div className="p-6 bg-white rounded shadow max-w-2xl mx-auto">
				<h2 className="text-2xl font-bold mb-4">Submitted Values</h2>
				<div className="grid grid-cols-1 gap-4">
					<div>
						<strong>Text Input:</strong> {values.textInput}
					</div>
					<div>
						<strong>Number Input:</strong> {values.numberInput}
					</div>
					<div>
						<strong>Email Input:</strong> {values.emailInput}
					</div>
					<div>
						<strong>Password Input:</strong> {values.passwordInput}
					</div>
					<div>
						<strong>Date Input:</strong> {values.dateInput}
					</div>
					<div>
						<strong>Range Input:</strong> {values.rangeInput}
					</div>
					<div>
						<strong>Textarea:</strong> {values.textarea}
					</div>
					<div>
						<strong>Single Select:</strong> {values.singleSelect}
					</div>
					<div>
						<strong>Multiple Select:</strong> {values.multipleSelect.join(', ')}
					</div>
					<div>
						<strong>Checkbox:</strong> {values.checkbox ? 'Checked' : 'Unchecked'}
					</div>
					<div>
						<strong>Radio:</strong> {values.radio}
					</div>
					<div>
						<strong>ARIA Checkbox:</strong>{' '}
						{values.ariaCheckbox ? 'Checked' : 'Unchecked'}
					</div>
					<div>
						<strong>ARIA Radio:</strong> {values.ariaRadio}
					</div>
					<div>
						<strong>ARIA Switch:</strong> {values.ariaSwitch ? 'On' : 'Off'}
					</div>
				</div>
				<button
					className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
					onClick={() => setSubmitted(false)}
				>
					Back to Form
				</button>
			</div>
		);
	}

	return (
		<div className="p-6 bg-white rounded shadow max-w-2xl mx-auto">
			<h2 className="text-2xl font-bold mb-4">Assertion Elements Test Form</h2>
			<form onSubmit={handleSubmit} className="space-y-6">
				{/* Regular Inputs */}
				<div className="space-y-4">
					<div>
						<label className="block mb-1" htmlFor="textInput">
							Text Input
						</label>
						<input
							id="textInput"
							name="textInput"
							type="text"
							value={values.textInput}
							onChange={handleChange}
							className="w-full p-2 border rounded"
						/>
					</div>

					<div>
						<label className="block mb-1" htmlFor="numberInput">
							Number Input
						</label>
						<input
							id="numberInput"
							name="numberInput"
							type="number"
							value={values.numberInput}
							onChange={handleChange}
							className="w-full p-2 border rounded"
						/>
					</div>

					<div>
						<label className="block mb-1" htmlFor="emailInput">
							Email Input
						</label>
						<input
							id="emailInput"
							name="emailInput"
							type="email"
							value={values.emailInput}
							onChange={handleChange}
							className="w-full p-2 border rounded"
						/>
					</div>

					<div>
						<label className="block mb-1" htmlFor="passwordInput">
							Password Input
						</label>
						<input
							id="passwordInput"
							name="passwordInput"
							type="password"
							value={values.passwordInput}
							onChange={handleChange}
							className="w-full p-2 border rounded"
						/>
					</div>

					<div>
						<label className="block mb-1" htmlFor="dateInput">
							Date Input
						</label>
						<input
							id="dateInput"
							name="dateInput"
							type="date"
							value={values.dateInput}
							onChange={handleChange}
							className="w-full p-2 border rounded"
						/>
					</div>

					<div>
						<label className="block mb-1" htmlFor="rangeInput">
							Range Input
						</label>
						<input
							id="rangeInput"
							name="rangeInput"
							type="range"
							min="0"
							max="100"
							value={values.rangeInput}
							onChange={handleChange}
							className="w-full"
						/>
						<span>{values.rangeInput}</span>
					</div>
				</div>

				{/* Textarea */}
				<div>
					<label className="block mb-1" htmlFor="textarea">
						Textarea
					</label>
					<textarea
						id="textarea"
						name="textarea"
						value={values.textarea}
						onChange={handleChange}
						className="w-full p-2 border rounded"
						rows={3}
					/>
				</div>

				{/* Selects */}
				<div className="space-y-4">
					<div>
						<label className="block mb-1" htmlFor="singleSelect">
							Single Select
						</label>
						<select
							id="singleSelect"
							name="singleSelect"
							value={values.singleSelect}
							onChange={handleChange}
							className="w-full p-2 border rounded"
						>
							<option value="1">One</option>
							<option value="2">Two</option>
							<option value="3">Three</option>
						</select>
					</div>

					<div>
						<label className="block mb-1" htmlFor="multipleSelect">
							Multiple Select
						</label>
						<select
							id="multipleSelect"
							name="multipleSelect"
							multiple
							value={values.multipleSelect}
							onChange={handleMultiSelectChange}
							className="w-full p-2 border rounded"
							size={3}
						>
							<option value="1">One</option>
							<option value="2">Two</option>
							<option value="3">Three</option>
						</select>
					</div>
				</div>

				{/* Checkbox and Radio */}
				<div className="space-y-2">
					<div className="flex items-center">
						<input
							id="checkbox"
							name="checkbox"
							type="checkbox"
							checked={values.checkbox}
							onChange={handleChange}
							className="mr-2"
						/>
						<label htmlFor="checkbox">Checkbox</label>
					</div>

					<div className="space-y-1">
						<div className="flex items-center">
							<input
								id="radio1"
								name="radio"
								type="radio"
								value="option1"
								checked={values.radio === 'option1'}
								onChange={handleChange}
								className="mr-2"
							/>
							<label htmlFor="radio1">Radio Option 1</label>
						</div>
						<div className="flex items-center">
							<input
								id="radio2"
								name="radio"
								type="radio"
								value="option2"
								checked={values.radio === 'option2'}
								onChange={handleChange}
								className="mr-2"
							/>
							<label htmlFor="radio2">Radio Option 2</label>
						</div>
					</div>
				</div>

				{/* ARIA elements */}
				<div className="space-y-4">
					<div
						role="checkbox"
						aria-checked={values.ariaCheckbox}
						onClick={() => handleAriaCheckboxChange('ariaCheckbox')}
						className="flex items-center cursor-pointer"
						tabIndex={0}
					>
						<div
							className={`w-5 h-5 mr-2 border rounded ${values.ariaCheckbox ? 'bg-blue-500' : 'bg-white'}`}
						></div>
						<span>ARIA Checkbox</span>
					</div>

					<div className="space-y-1">
						<div
							role="radio"
							aria-checked={values.ariaRadio === 'option1'}
							onClick={() => handleAriaRadioChange('option1')}
							className="flex items-center cursor-pointer"
							tabIndex={0}
						>
							<div
								className={`w-4 h-4 mr-2 rounded-full border ${values.ariaRadio === 'option1' ? 'bg-blue-500' : 'bg-white'}`}
							></div>
							<span>ARIA Radio Option 1</span>
						</div>
						<div
							role="radio"
							aria-checked={values.ariaRadio === 'option2'}
							onClick={() => handleAriaRadioChange('option2')}
							className="flex items-center cursor-pointer"
							tabIndex={0}
						>
							<div
								className={`w-4 h-4 mr-2 rounded-full border ${values.ariaRadio === 'option2' ? 'bg-blue-500' : 'bg-white'}`}
							></div>
							<span>ARIA Radio Option 2</span>
						</div>
					</div>

					<div
						role="switch"
						aria-checked={values.ariaSwitch}
						onClick={() => handleAriaCheckboxChange('ariaSwitch')}
						className="flex items-center cursor-pointer"
						tabIndex={0}
					>
						<div
							className={`w-10 h-5 mr-2 rounded-full relative ${values.ariaSwitch ? 'bg-blue-500' : 'bg-gray-300'}`}
						>
							<div
								className={`absolute w-4 h-4 rounded-full bg-white top-0.5 transition-transform ${values.ariaSwitch ? 'translate-x-5' : 'translate-x-0.5'}`}
							></div>
						</div>
						<span>ARIA Switch</span>
					</div>
				</div>

				{/* Disabled Fieldset */}
				<div className="space-y-2">
					<div className="flex items-center">
						<input
							id="fieldsetToggle"
							type="checkbox"
							checked={fieldsetDisabled}
							onChange={() => setFieldsetDisabled(!fieldsetDisabled)}
							className="mr-2"
						/>
						<label htmlFor="fieldsetToggle">Disable Fieldset Elements</label>
					</div>

					<fieldset disabled={fieldsetDisabled} className="p-4 border rounded">
						<legend>Fieldset Elements</legend>
						<div className="space-y-4">
							<div>
								<label className="block mb-1" htmlFor="fieldsetInput">
									Input in Fieldset
								</label>
								<input
									id="fieldsetInput"
									type="text"
									placeholder="Input in fieldset"
									className="w-full p-2 border rounded"
								/>
							</div>

							<button
								type="button"
								className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
							>
								Button in Fieldset
							</button>
						</div>
					</fieldset>
				</div>

				{/* Buttons */}
				<div className="space-y-2">
					<div className="space-x-2">
						<button
							type="submit"
							className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
						>
							Submit Form
						</button>

						<button
							type="button"
							disabled
							className="px-4 py-2 bg-gray-300 text-gray-500 rounded cursor-not-allowed"
						>
							Disabled Button
						</button>

						<button type="button" className="px-4 py-2 border rounded">
							{/* Button with no text */}
						</button>
					</div>

					<div className="space-x-2">
						<input
							type="submit"
							value="Submit Input"
							className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
						/>

						<input
							type="button"
							value="Button Input"
							className="px-4 py-2 border rounded hover:bg-gray-100"
						/>
					</div>
				</div>

				{/* Links */}
				<div className="space-x-2">
					<a href="#" className="text-blue-500 hover:underline">
						Link with href
					</a>
					<span className="text-gray-500">|</span>
					<a className="text-gray-400 cursor-not-allowed">Link without href</a>
				</div>

				{/* Div with text */}
				<div className="p-2 bg-gray-100 rounded">
					This is a div with text content
				</div>
			</form>
		</div>
	);
};
