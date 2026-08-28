import React, { useState } from 'react';
import {
  CreditCard,
  Smartphone,
  Landmark,
  CheckCircle2,
  Lock,
  ShieldCheck,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { MembershipPlan } from '../../types/index.js';
import { formatINR } from '../../utils/formatters.js';
import { NeuModal, NeuButton, NeuInput, NeuSelect, NeuBadge, NeuTabs } from '../neumorphic/index.js';

export interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: MembershipPlan | null;
  isRenewal?: boolean;
  onSuccess: (paymentMethod: string) => Promise<void>;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  plan,
  isRenewal = false,
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'card' | 'upi' | 'netbanking'>('card');
  const [step, setStep] = useState<'details' | 'processing' | 'receipt'>('details');

  // Card Form State (Empty / No prefilled details)
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // UPI Form State (Empty / No prefilled details)
  const [upiId, setUpiId] = useState('');
  const [selectedUpiApp, setSelectedUpiApp] = useState('gpay');

  // NetBanking State (Empty / No prefilled details)
  const [selectedBank, setSelectedBank] = useState('HDFC');
  const [netBankingUserId, setNetBankingUserId] = useState('');

  // Completed Payment Record
  const [receiptData, setReceiptData] = useState<{
    paymentId: string;
    txnRef: string;
    date: string;
    method: string;
  } | null>(null);

  if (!isOpen || !plan) return null;

  const handleCardNumberChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').substring(0, 16);
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').substring(0, 4);
    if (cleaned.length >= 3) {
      setCardExpiry(`${cleaned.substring(0, 2)}/${cleaned.substring(2)}`);
    } else {
      setCardExpiry(cleaned);
    }
  };

  const handleProcessCheckout = async (methodName: string) => {
    setStep('processing');

    setTimeout(async () => {
      try {
        await onSuccess(methodName);
        const payId = 'PAY-' + Math.floor(10000 + Math.random() * 90000);
        const txnRef = 'TXN_AMR_' + Math.floor(10000000 + Math.random() * 90000000);
        setReceiptData({
          paymentId: payId,
          txnRef,
          date: new Date().toISOString(),
          method: methodName
        });
        setStep('receipt');
      } catch (err) {
        setStep('details');
      }
    }, 1500);
  };

  const handleCloseAndReset = () => {
    setStep('details');
    setReceiptData(null);
    setCardName('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setUpiId('');
    setNetBankingUserId('');
    onClose();
  };

  return (
    <NeuModal
      isOpen={isOpen}
      onClose={handleCloseAndReset}
      title={
        step === 'receipt'
          ? 'Payment Receipt'
          : isRenewal
          ? `Renew ${plan.name} Membership`
          : `Subscribe to ${plan.name}`
      }
    >
      {/* STEP 1: PROCESSING SPINNER */}
      {step === 'processing' && (
        <div className="py-12 text-center space-y-4 animate-fade-in">
          <div className="w-16 h-16 rounded-full neu-pressed mx-auto flex items-center justify-center text-emerald-600 animate-spin">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h4 className="text-lg font-bold text-gray-900">Processing Payment Transaction</h4>
            <p className="text-xs text-gray-500">Connecting with Payment Gateway...</p>
          </div>
          <NeuBadge variant="emerald" size="sm">256-Bit SSL Encrypted</NeuBadge>
        </div>
      )}

      {/* STEP 2: DIGITAL RECEIPT */}
      {step === 'receipt' && receiptData && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-emerald-950">Membership Activated Successfully!</h4>
              <p className="text-xs text-emerald-700">Your membership status has been updated.</p>
            </div>
          </div>

          <div className="p-6 neu-pressed rounded-3xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-gray-300/40 pb-3">
              <span className="font-extrabold uppercase text-gray-500">Payment ID</span>
              <span className="font-mono font-bold text-gray-900">{receiptData.paymentId}</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-300/40 pb-3">
              <span className="font-extrabold uppercase text-gray-500">Txn Reference</span>
              <span className="font-mono text-gray-800">{receiptData.txnRef}</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-300/40 pb-3">
              <span className="font-extrabold uppercase text-gray-500">Plan Tier</span>
              <span className="font-bold text-gray-900">{plan.name} ({plan.durationMonths} Months)</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-300/40 pb-3">
              <span className="font-extrabold uppercase text-gray-500">Payment Method</span>
              <span className="font-semibold uppercase text-emerald-700">{receiptData.method.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between items-center pt-1 text-sm font-black text-gray-900">
              <span>Amount Paid:</span>
              <span className="text-emerald-600 text-lg">{formatINR(plan.pricePaise)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <NeuButton variant="primary" className="w-full" onClick={handleCloseAndReset}>
              Done & Return to Dashboard <ArrowRight className="w-4 h-4" />
            </NeuButton>
          </div>
        </div>
      )}

      {/* STEP 3: DETAILS & PAYMENT METHOD SELECTION */}
      {step === 'details' && (
        <div className="space-y-6">
          {/* Plan Summary Header */}
          <div className="p-4 neu-pressed rounded-2xl flex justify-between items-center">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 block">Order Summary</span>
              <h4 className="text-base font-bold text-gray-900">{plan.name} Tier</h4>
              <p className="text-xs text-gray-500">{plan.durationMonths} Months Full Club Access</p>
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-gray-900 block">{formatINR(plan.pricePaise)}</span>
              <span className="text-[10px] text-gray-400 font-semibold">Incl. Taxes</span>
            </div>
          </div>

          {/* Payment Method Tabs */}
          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wide text-gray-600 uppercase">Select Payment Method</label>
            <NeuTabs
              tabs={[
                { id: 'card', label: 'Card', icon: <CreditCard className="w-4 h-4" /> },
                { id: 'upi', label: 'UPI / Mobile', icon: <Smartphone className="w-4 h-4" /> },
                { id: 'netbanking', label: 'Net Banking', icon: <Landmark className="w-4 h-4" /> },
              ]}
              activeTab={activeTab}
              onChange={id => setActiveTab(id as any)}
            />
          </div>

          {/* TAB 1: CREDIT / DEBIT CARD */}
          {activeTab === 'card' && (
            <form onSubmit={e => { e.preventDefault(); handleProcessCheckout('simulated_card'); }} className="space-y-4 animate-fade-in">
              <NeuInput
                label="Cardholder Name"
                value={cardName}
                onChange={e => setCardName(e.target.value)}
                placeholder="Name on card"
                required
              />

              <NeuInput
                label="Card Number"
                value={cardNumber}
                onChange={e => handleCardNumberChange(e.target.value)}
                placeholder="4532 8912 3456 7890"
                icon={<CreditCard className="w-4 h-4" />}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <NeuInput
                  label="Expiry (MM/YY)"
                  value={cardExpiry}
                  onChange={e => handleExpiryChange(e.target.value)}
                  placeholder="MM/YY"
                  required
                />
                <NeuInput
                  label="CVV Code"
                  type="password"
                  value={cardCvv}
                  onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
                  placeholder="•••"
                  icon={<Lock className="w-4 h-4" />}
                  required
                />
              </div>

              <div className="pt-2">
                <NeuButton variant="primary" type="submit" className="w-full">
                  Pay {formatINR(plan.pricePaise)} via Card <ArrowRight className="w-4 h-4" />
                </NeuButton>
              </div>
            </form>
          )}

          {/* TAB 2: UPI PAYMENTS */}
          {activeTab === 'upi' && (
            <form onSubmit={e => { e.preventDefault(); handleProcessCheckout('simulated_upi'); }} className="space-y-4 animate-fade-in">
              <NeuInput
                label="Enter Virtual Payment Address (UPI ID)"
                value={upiId}
                onChange={e => setUpiId(e.target.value)}
                placeholder="username@bank"
                icon={<Smartphone className="w-4 h-4" />}
                required
              />

              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-wide text-gray-600 uppercase">Or Select UPI App</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'gpay', label: 'GPay' },
                    { id: 'phonepe', label: 'PhonePe' },
                    { id: 'paytm', label: 'Paytm' },
                    { id: 'bhim', label: 'BHIM' },
                  ].map(app => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => setSelectedUpiApp(app.id)}
                      className={`p-3 rounded-2xl text-xs font-bold transition-all ${
                        selectedUpiApp === app.id ? 'neu-pressed text-emerald-600' : 'neu-raised text-gray-700'
                      }`}
                    >
                      {app.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <NeuButton variant="primary" type="submit" className="w-full">
                  Verify & Pay {formatINR(plan.pricePaise)} via UPI <ArrowRight className="w-4 h-4" />
                </NeuButton>
              </div>
            </form>
          )}

          {/* TAB 3: NET BANKING */}
          {activeTab === 'netbanking' && (
            <form onSubmit={e => { e.preventDefault(); handleProcessCheckout('simulated_netbanking'); }} className="space-y-4 animate-fade-in">
              <NeuSelect
                label="Select Bank"
                value={selectedBank}
                onChange={e => setSelectedBank(e.target.value)}
                options={[
                  { label: 'HDFC Bank NetBanking', value: 'HDFC' },
                  { label: 'State Bank of India (SBI)', value: 'SBI' },
                  { label: 'ICICI Bank', value: 'ICICI' },
                  { label: 'Axis Bank', value: 'AXIS' },
                  { label: 'Kotak Mahindra Bank', value: 'KOTAK' },
                ]}
              />

              <NeuInput
                label="Customer User ID / Account ID"
                value={netBankingUserId}
                onChange={e => setNetBankingUserId(e.target.value)}
                placeholder="User ID"
                required
              />

              <div className="pt-2">
                <NeuButton variant="primary" type="submit" className="w-full">
                  Proceed to {selectedBank} NetBanking <ArrowRight className="w-4 h-4" />
                </NeuButton>
              </div>
            </form>
          )}
        </div>
      )}
    </NeuModal>
  );
};
