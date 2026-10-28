@extends('emails.layout')

@section('title', 'Kere-ის შეთავაზება')

@section('content')
  <h1>თქვენი შეკვეთის შეთავაზება მზადაა</h1>
  @if($order->order_type === 'remodel')
    <p>Kere-მ თქვენი გადაკეთების მოთხოვნისთვის მოამზადა საბოლოო ფასი და შესრულების ვადა. დაადასტურეთ ან უარი თქვით თქვენს პანელზე.</p>
  @else
    <p>Kere-მ თქვენი შეკვეთისთვის მოამზადა საბოლოო ფასი და შესრულების ვადა. დაადასტურეთ ან უარი თქვით თქვენს პანელზე.</p>
  @endif

  <div class="row"><span class="label">შეკვეთა</span><span class="value">{{ $order->order_number }}</span></div>
  <div class="row"><span class="label">ფასი</span><span class="value">₾{{ number_format($offer['price'], 2) }}</span></div>
  <div class="row"><span class="label">მიწოდება</span><span class="value">₾{{ number_format($offer['shipping'], 2) }}</span></div>
  <div class="row"><span class="label">სულ</span><span class="value">₾{{ number_format($offer['total'], 2) }}</span></div>
  @if($offer['first_payment'] !== null)
  <div class="row"><span class="label">პირველი გადახდა</span><span class="value">₾{{ number_format($offer['first_payment'], 2) }}</span></div>
  @endif
  <div class="row"><span class="label">ვადა</span><span class="value">{{ $order->order_type === 'remodel' ? 'სამოსის მიღებიდან '.$offer['days'].' დღეში' : $offer['days'].' დღე' }}</span></div>
  @if(filled($offer['note']))
  <div class="row"><span class="label">შენიშვნა</span><span class="value">{{ $offer['note'] }}</span></div>
  @endif

  @if($order->order_type === 'remodel')
  <p style="margin-top:20px">დადასტურებისას გადაიხდით ფასის ნახევარს და მიწოდების საფასურს, მეორე ნახევარს — სამუშაოს დასრულების შემდეგ.</p>
  @endif
  <p style="margin-top:20px">შეთავაზების სანახავად გადადით <a href="{{ config('app.url') }}/customer-dashboard">თქვენს პანელზე</a>.</p>
@endsection
