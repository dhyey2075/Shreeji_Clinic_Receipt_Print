import { useState } from 'react'
import './App.css'

function App() {
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    amount: '',
    onAccountOf: '',
    paymentMode: 'Cash' // Default value
  });
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    setIsLoading(true);
    setData(null);
    e.preventDefault();
    
    try {
      // Build query string from form data
      const queryParams = new URLSearchParams(formData).toString();
      const url = `https://shreeji-clinic-receipt-print.onrender.com/receipt?${queryParams}`;
      console.log(url)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      console.log('Response:', data);
      setData(data);
      setFormData({
        name: '',
        date: '',
        amount: '',
        onAccountOf: '',
        paymentMode: 'Cash' // Default value
      })
      // Handle success - perhaps show a success message or receipt
    } catch (error) {
      console.error('Error submitting form:', error);
      // Handle error - show error message
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="receipt-form-container">
      <h1>Shreeji Clinic Receipt</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="date">Date:</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="date">Receipt No:</label>
          <input
            type="text"
            id="receiptNo"
            name="receiptNo"
            value={formData.receiptNo}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="amount">Amount:</label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="onAccountOf">On Account Of:</label>
          <textarea
            id="onAccountOf"
            name="onAccountOf"
            value={formData.onAccountOf}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="paymentMode">Payment Mode:</label>
          <select
            id="paymentMode"
            name="paymentMode"
            value={formData.paymentMode}
            onChange={handleChange}
            required
          >
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="UPI">UPI</option>
            <option value="Cheque">Cheque</option>
          </select>
        </div>

        <button type="submit" className="submit-btn">{isLoading ? "Printing..." : "Generate Receipt"}</button>
      </form>
      {
        data && (
          <div className="receipt-result">
            <h2>Receipt Generated Successfully!</h2>
            <img src={data.qrImage} alt="" />
            <a href={data.pdfUrl}></a>
          </div>
        )
      }
    </div>
  )
}

export default App