import { useState, useEffect } from 'react';
import Select from 'react-select';
import { FaExchangeAlt } from 'react-icons/fa';
import CountUp from 'react-countup';
import { RiExchangeDollarLine } from "react-icons/ri";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { RiBarChart2Line } from "react-icons/ri";
import { currencyMap } from './currency-map';
import './index.css';

// Componentes da Recharts
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Cell } from 'recharts';

// Funções e constantes
const formatOptionLabel = ({ value, label }) => {
    const countryCode = currencyMap[value];
    if (countryCode) {
        return (
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <img src={`https://flagcdn.com/16x12/${countryCode.toLowerCase()}.png`} alt={`${label} flag`} style={{ marginRight: 10, borderRadius: '2px' }} />
                {label}
            </div>
        );
    }
    return (
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: 10, fontSize: '1.2em' }}>🌐</span>
            {label}
        </div>
    );
};

const customStyles = {
    control: (provided, state) => ({ ...provided, minHeight: '56px', border: '1px solid var(--border-color)', borderRadius: '10px', background: 'var(--input-bg)', boxShadow: 'none', borderColor: state.isFocused ? 'var(--primary-color)' : 'var(--border-color)', '&:hover': { borderColor: 'var(--primary-color)' }, fontFamily: "'Poppins', sans-serif", width: '100%', }),
    singleValue: (provided) => ({ ...provided, color: '#EAEAEA' }),
    menu: (provided) => ({ ...provided, background: '#1c2135', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.1)' }),
    option: (provided, state) => ({ ...provided, backgroundColor: state.isSelected ? 'var(--primary-color)' : state.isFocused ? 'rgba(0, 123, 255, 0.2)' : 'transparent', color: state.isSelected ? 'white' : '#EAEAEA', borderRadius: '8px', margin: '0 8px', width: 'calc(100% - 16px)' }),
    input: (provided) => ({ ...provided, color: '#EAEAEA' }),
    placeholder: (provided) => ({ ...provided, color: '#a0a0a0' }),
};

const MAJOR_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'BRL', 'CNH'];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">{` ${label} Value`}</p>
          <p className="intro">{`${payload[0].value.toFixed(4)}`}</p>
        </div>
      );
    }
    return null;
};

function App() {
    const [amount, setAmount] = useState('');
    const [fromCurrency, setFromCurrency] = useState({ value: 'USD', label: 'USD' });
    const [toCurrency, setToCurrency] = useState({ value: 'BRL', label: 'BRL' });
    const [currencies, setCurrencies] = useState([]);
    const [result, setResult] = useState({ convertedAmount: 0, exchangeRate: 0 });
    const [isLoading, setIsLoading] = useState(false);
    const [chartData, setChartData] = useState([]);
    const [isChartLoading, setIsChartLoading] = useState(false);
    const [prevAmount, setPrevAmount] = useState(0);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    useEffect(() => {
        async function fetchCurrencies() {
            try {
                const response = await fetch('https://api.frankfurter.app/latest');
                const data = await response.json();
                const currencyOptions = Object.keys(data.rates).map(currency => ({ value: currency, label: currency }));
                setCurrencies([{ value: data.base, label: data.base }, ...currencyOptions]);
            } catch (error) { console.error("Erro ao buscar moedas:", error); }
        }
        fetchCurrencies();
    }, []);

    useEffect(() => {
        const numericAmount = parseFloat(amount);
        if (!numericAmount || numericAmount <= 0 || !fromCurrency || !toCurrency) {
            setResult({ convertedAmount: 0, exchangeRate: 0 });
            return;
        }
        if (fromCurrency.value === toCurrency.value) {
            setPrevAmount(result.convertedAmount);
            setResult({ convertedAmount: numericAmount, exchangeRate: 1 });
            return;
        }
        async function convertCurrency() {
            setIsLoading(true);
            try {
                const rateResponse = await fetch(`https://api.frankfurter.app/latest?from=${fromCurrency.value}&to=${toCurrency.value}`);
                const rateData = await rateResponse.json();
                const exchangeRate = rateData.rates[toCurrency.value];
                setPrevAmount(result.convertedAmount);
                setResult({
                    convertedAmount: (numericAmount * exchangeRate),
                    exchangeRate: exchangeRate
                });
            } catch (error) {
                console.error("Erro na conversão:", error);
                setResult({ convertedAmount: 0, exchangeRate: 0 });
            } finally {
                setIsLoading(false);
            }
        }
        const timer = setTimeout(() => convertCurrency(), 500);
        return () => clearTimeout(timer);
    }, [amount, fromCurrency, toCurrency]);

    useEffect(() => {
        const numericAmount = parseFloat(amount);
        if (!fromCurrency || isInitialLoad) return;
        setIsChartLoading(true);
        const targetCurrencies = MAJOR_CURRENCIES.filter(c => c !== fromCurrency.value).join(',');
        async function fetchChartData() {
            try {
                const response = await fetch(`https://api.frankfurter.app/latest?amount=${numericAmount || 1}&from=${fromCurrency.value}&to=${targetCurrencies}`);
                const data = await response.json();
                const formattedData = Object.keys(data.rates).map(currency => ({ name: currency, value: data.rates[currency] }));
                setChartData(formattedData);
            } catch (error) {
                console.error("Erro ao buscar dados do gráfico:", error);
            } finally {
                setIsChartLoading(false);
            }
        }
        fetchChartData();
    }, [amount, fromCurrency, isInitialLoad]);

    const handleSwap = () => {
        setFromCurrency(toCurrency);
        setToCurrency(fromCurrency);
    };
    
    const handleAmountChange = (e) => {
        let value = e.target.value;
        value = value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
        if (value.length > 1 && value.startsWith('0') && !value.startsWith('0.')) {
            value = value.substring(1);
        }
        setAmount(value);
        if (isInitialLoad && value !== '') {
            setIsInitialLoad(false);
        }
    };

    return (
        <div className="app-container">
            <div className="page-wrapper">
                <div className="main-content">
                    <div className="converter-panel">
                        <h1 className="panel-title">Currency Converter</h1>
                        <div className="input-row">
                            <div className="input-wrapper full-width">
                                <label>Value</label>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    className="amount-input"
                                    value={amount}
                                    onChange={handleAmountChange}
                                    placeholder="0,00"
                                />
                            </div>
                        </div>
                        <div className="input-row">
                            <div className="input-wrapper">
                                <label>From</label>
                                <Select options={currencies} value={fromCurrency} onChange={setFromCurrency} styles={customStyles} formatOptionLabel={formatOptionLabel} isSearchable/>
                            </div>
                            <div className="swap-button-wrapper">
                                <button onClick={handleSwap} className="swap-button" aria-label="Inverter moedas">
                                    <FaExchangeAlt />
                                </button>
                            </div>
                            <div className="input-wrapper">
                                <label>To</label>
                                <Select options={currencies} value={toCurrency} onChange={setToCurrency} styles={customStyles} formatOptionLabel={formatOptionLabel} isSearchable/>
                            </div>
                        </div>
                        <div className="result-wrapper">
                            {isLoading ? <p className="loading-text">Calculando...</p> : (
                                !isInitialLoad && result.convertedAmount > 0 && (
                                    <>
                                        <p className="result-text">
                                            {parseFloat(amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {fromCurrency.label} =
                                            <span className="result-highlight">
                                                <CountUp
                                                    start={prevAmount}
                                                    end={result.convertedAmount}
                                                    duration={1}
                                                    separator="."
                                                    decimal=","
                                                    decimals={2}
                                                />
                                                {' '}{toCurrency.label}
                                            </span>
                                        </p>
                                        <p className="exchange-rate">
                                            <RiExchangeDollarLine /> 1 {fromCurrency.label} = {Number(result.exchangeRate).toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} {toCurrency.label}
                                        </p>
                                    </>
                                )
                            )}
                        </div>
                    </div>
                    
                    <div className="chart-panel">
                        <h2 className="panel-title"> {fromCurrency?.label} - Based Exchange</h2>
                        {isInitialLoad ? (
                            <div className="chart-placeholder">
                                <RiBarChart2Line />
                                <p>Insert a Currency Value</p>
                            </div>
                        ) : isChartLoading ? (
                            <p className="loading-text">Loading Graphics...</p>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                                    <XAxis type="number" stroke="#a0a0a0" fontSize={12} />
                                    <YAxis dataKey="name" type="category" stroke="#a0a0a0" fontSize={12} width={50} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 123, 255, 0.1)' }} />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "var(--primary-color)" : "rgba(0, 123, 255, 0.6)"} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                <footer className="footer">
                   <p>Developed By João Gabriel Maia</p>
                    <div className="social-links">
                        <a href="https://github.com/Joaodev0-arch" target="_blank" rel="noopener noreferrer" className="social-icon">
                            <FaGithub />
                        </a>
                        <a href="https://www.linkedin.com/in/joao-moura-maia" target="_blank" rel="noopener noreferrer" className="social-icon">
                            <FaLinkedin />
                        </a>
                    </div>
                </footer>
            </div>
        </div>
    );
}

export default App;