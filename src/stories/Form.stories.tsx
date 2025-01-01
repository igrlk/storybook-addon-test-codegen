import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

const Component = () => {
	const [email, setEmail] = useState('');
	const [username, setUsername] = useState('');
	const [note, setNote] = useState('');
	const [selectedOption, setSelectedOption] = useState<string | null>(null);
	const [files, setFiles] = useState<File[]>([]);
	const [date, setDate] = useState('');
	const [formError, setFormError] = useState('');
	const [isSubmitSuccessful, setIsSubmitSuccessful] = useState(false);

	const onSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!email) {
			return setFormError('Email is required');
		}

		setIsSubmitSuccessful(true);
	};

	return (
		<div className="flex items-center justify-center p-12">
			<div className="mx-auto w-full max-w-[800px] bg-white">
				{isSubmitSuccessful ? (
					<div className="flex items-center justify-center bg-green-100 flex-col gap-5 p-10">
						<div>Thank you for submitting!</div>

						<div className="flex flex-col items-center gap-3">
							{[
								`Email: ${email}`,
								`Username: ${username}`,
								`Note: ${note}`,
								`Option: ${selectedOption}`,
								`Files: ${files.map((file) => file.name).join(', ')}`,
								`Date: ${date}`,
							].map((text) => (
								<div key={text}>{text}</div>
							))}
						</div>
					</div>
				) : (
					<form onSubmit={onSubmit} className="flex flex-col gap-5">
						<div className="flex flex-wrap items-end">
							<div className="px-3 sm:w-1/2">
								<label
									htmlFor="email"
									className="mb-3 block text-base font-medium text-[#07074D]"
								>
									Email Address
								</label>
								<input
									type="email"
									name="email"
									id="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="Enter your email"
									className="w-full rounded-md border border-[#e0e0e0] bg-white py-3 px-6 text-base font-medium text-[#6B7280] outline-none focus:border-[#6A64F1] focus:shadow-md"
								/>
							</div>
							<div className="px-3 sm:w-1/2">
								<input
									type="text"
									name="username"
									id="username"
									value={username}
									onChange={(e) => setUsername(e.target.value)}
									placeholder="Enter your username"
									className="w-full rounded-md border border-[#e0e0e0] bg-white py-3 px-6 text-base font-medium text-[#6B7280] outline-none focus:border-[#6A64F1] focus:shadow-md"
								/>
							</div>
						</div>

						<div className="flex flex-wrap items-start">
							<div className="px-3 sm:w-1/2">
								<label
									htmlFor="note"
									className="mb-3 block text-base font-medium text-[#07074D]"
								>
									Note
								</label>
								<textarea
									name="note"
									id="note"
									value={note}
									onChange={(e) => setNote(e.target.value)}
									placeholder="Enter note"
									className="w-full rounded-md border border-[#e0e0e0] bg-white py-3 px-6 text-base font-medium text-[#6B7280] outline-none focus:border-[#6A64F1] focus:shadow-md"
								/>
							</div>
							<div className="px-3 sm:w-1/2">
								<label
									htmlFor="select"
									className="mb-3 block text-base font-medium text-[#07074D]"
								>
									Option
								</label>
								<select
									name="select"
									id="select"
									className="w-full rounded-md border border-[#e0e0e0] bg-white py-3 px-6 text-base font-medium text-[#6B7280] outline-none focus:border-[#6A64F1] focus:shadow-md"
									value={selectedOption || ''}
									onChange={(e) => setSelectedOption(e.target.value)}
								>
									{new Array(3).fill(null).map((_, i) => (
										// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
										<option key={i} value={i + 1}>
											{i + 1}
										</option>
									))}
								</select>
							</div>
						</div>

						<div className="flex flex-wrap">
							<div className="px-3 sm:w-1/2">
								<label
									htmlFor="file"
									className="mb-3 block text-base font-medium text-[#07074D]"
								>
									File
								</label>
								<input
									id="file"
									type="file"
									onChange={(e) => setFiles([...(e.target.files ?? [])])}
									className="w-full rounded-md border border-[#e0e0e0] bg-white p-2.5 text-base font-medium text-[#6B7280] outline-none focus:border-[#6A64F1] focus:shadow-md"
								/>
							</div>
							<div className="px-3 sm:w-1/2">
								<label
									htmlFor="date"
									className="mb-3 block text-base font-medium text-[#07074D]"
								>
									Date
								</label>
								<input
									type="date"
									name="date"
									id="date"
									value={date}
									onChange={(e) => setDate(e.target.value)}
									className="w-full rounded-md border border-[#e0e0e0] bg-white py-3 px-6 text-base font-medium text-[#6B7280] outline-none focus:border-[#6A64F1] focus:shadow-md"
								/>
							</div>
						</div>

						{formError && <div className="text-red-500 text-sm">{formError}</div>}

						<button
							type="submit"
							className="hover:shadow-form w-full rounded-md bg-[#6A64F1] py-3 px-8 text-center text-base font-semibold text-white outline-none mx-3"
						>
							<div>Submit</div>
						</button>
					</form>
				)}
			</div>
		</div>
	);
};

const meta: Meta<typeof Component> = {
	title: 'Form',
	component: Component,
};

export default meta;
type Story = StoryObj<typeof Component>;

export const Default: Story = {
	play: async ({ canvasElement }) => {},
};
