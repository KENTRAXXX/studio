import React from 'react';

export const OrderConfirmationEmail = ({ orderId, storeName }: { orderId: string, storeName: string }) => (
  <div>
    <h1>Order Confirmed: #{orderId}</h1>
    <p>Thank you for your purchase from {storeName}!</p>
    <p>We've received your order and are getting it ready for shipment. We'll notify you again once it's on its way.</p>
  </div>
);

export const ShippedEmail = ({ orderId, storeName }: { orderId: string, storeName: string }) => (
    <div>
      <h1>Your Order #{orderId} from {storeName} Has Shipped!</h1>
      <p>Your items are on their way. You can track your package using the link in the shipping confirmation email.</p>
    </div>
);

export const CancelledEmail = ({ orderId, storeName }: { orderId: string, storeName: string }) => (
    <div>
      <h1>Order Cancelled: #{orderId}</h1>
      <p>Your order from {storeName} has been cancelled as requested. If you have any questions, please contact support.</p>
    </div>
);
