@extends('emails.layout')

@section('title', 'შეკვეთის სტატუსი განახლდა')

@section('content')
  <h1>შეკვეთის სტატუსი განახლდა</h1>
  <p>გამარჯობა, {{ $order->first_name }}! თქვენი შეკვეთის სიახლე:</p>
  <div class="order-num">{{ $order->order_number }}</div><br>
  <div class="status-badge">{{ $statusLabel }}</div>
  <p>{{ $statusMessage }}</p>
  <p>შეკვეთის მიმდინარეობას თვალი ადევნეთ <a href="{{ config('app.url') }}/customer-dashboard">თქვენს პანელზე</a>.</p>
@endsection
