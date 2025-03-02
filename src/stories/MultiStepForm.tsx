import type React from 'react';
import { useState } from 'react';

export function MultiStepForm() {
	const [step, setStep] = useState(1);
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		phone: '',
		address: '',
	});

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prevData) => ({
			...prevData,
			[name]: value,
		}));
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setStep(step + 1);
	};

	return (
		<div className="min-h-screen bg-gray-100 flex items-center justify-center">
			<div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
				<h2 className="text-2xl font-bold mb-6 text-center">
					{step === 1
						? 'Personal Information'
						: step === 2
							? 'Contact Details'
							: 'Thank you!'}
				</h2>
				<form onSubmit={handleSubmit}>
					{step === 1 ? (
						<>
							<div className="mb-4">
								<label
									htmlFor="name"
									className="block text-gray-700 text-sm font-bold mb-2"
								>
									Name
								</label>
								<input
									type="text"
									id="name"
									name="name"
									value={formData.name}
									onChange={handleChange}
									className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
									required
								/>
							</div>
							<div className="mb-6">
								<label
									htmlFor="email"
									className="block text-gray-700 text-sm font-bold mb-2"
								>
									Email
								</label>
								<input
									type="email"
									id="email"
									name="email"
									value={formData.email}
									onChange={handleChange}
									className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
									required
								/>
							</div>
						</>
					) : step === 2 ? (
						<>
							<div className="mb-4">
								<label
									htmlFor="phone"
									className="block text-gray-700 text-sm font-bold mb-2"
								>
									Phone
								</label>
								<input
									type="tel"
									id="phone"
									name="phone"
									value={formData.phone}
									onChange={handleChange}
									className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
									required
								/>
							</div>
							<div className="mb-6">
								<label
									htmlFor="address"
									className="block text-gray-700 text-sm font-bold mb-2"
								>
									Address
								</label>
								<input
									type="text"
									id="address"
									name="address"
									value={formData.address}
									onChange={handleChange}
									className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
									required
								/>
							</div>
						</>
					) : (
						<div className="text-center">
							<p className="text-gray-600 mb-5">
								Your form has been submitted successfully.
							</p>

							<div className="text-gray-600">The data you submitted is:</div>
							{(['name', 'email', 'phone', 'address'] as const).map((key) => (
								<div key={key} className="text-gray-600">
									<span className="font-bold">{key}</span>: {formData[key]}
								</div>
							))}
						</div>
					)}
					{step <= 2 && (
						<div className="flex items-center justify-between">
							<button
								type="submit"
								className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
							>
								Submit
							</button>
						</div>
					)}
				</form>
			</div>
		</div>
	);
}
