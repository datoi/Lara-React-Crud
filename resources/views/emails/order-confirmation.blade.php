@extends('emails.layout')

@section('title', $order->order_type === 'marketplace' ? 'შეკვეთა დადასტურებულია' : 'შეკვეთა მიღებულია')

@section('content')
  @if($order->order_type === 'marketplace')
    <h1>შეკვეთა დადასტურებულია</h1>
    <p>გამარჯობა, {{ $order->first_name }}! გადახდა მიღებულია და თქვენი შეკვეთა მკერავს გადაეცა.</p>
  @elseif($order->order_type === 'remodel')
    <h1>გადაკეთების მოთხოვნა მიღებულია</h1>
    <p>გამარჯობა, {{ $order->first_name }}! Kere შეაფასებს თქვენს მოთხოვნას და თქვენს პანელზე გამოგიგზავნით შეთავაზებას საბოლოო ფასითა და ვადით.</p>
    <p>შეთავაზების დადასტურებისას გადაიხდით ფასის ნახევარს და მიწოდების საფასურს, მეორე ნახევარს — სამუშაოს დასრულების შემდეგ. სამოსს კურიერი წაიღებს და დაგიბრუნებთ.</p>
  @else
    <h1>შეკვეთა მიღებულია</h1>
    <p>გამარჯობა, {{ $order->first_name }}! Kere შეაფასებს თქვენს შეკვეთას და თქვენს პანელზე გამოგიგზავნით შეთავაზებას საბოლოო ფასითა და ვადით.</p>
  @endif

  <div class="order-num">{{ $order->order_number }}</div>

  @if($order->items->count())
  <table>
    <thead>
      <tr>
        <th>ნივთი</th>
        <th style="text-align:right">ფასი</th>
      </tr>
    </thead>
    <tbody>
      @foreach($order->items as $item)
      <tr>
        <td>
          {{ $item->product_name }}
          @if($item->size) <span style="color:#94a3b8"> · ზომა {{ $item->size }}</span>@endif
          @if($item->quantity > 1) <span style="color:#94a3b8"> × {{ $item->quantity }}</span>@endif
        </td>
        <td style="text-align:right">₾{{ number_format($item->price * $item->quantity, 2) }}</td>
      </tr>
      @endforeach
      <tr>
        <td style="color:#94a3b8">მიწოდება</td>
        <td style="text-align:right;color:#94a3b8">₾{{ number_format($order->shipping, 2) }}</td>
      </tr>
      <tr class="total-row">
        <td>სულ</td>
        <td style="text-align:right">₾{{ number_format($order->total, 2) }}</td>
      </tr>
    </tbody>
  </table>
  @endif

  <p>შეკვეთის მიმდინარეობას თვალი ადევნეთ <a href="{{ config('app.url') }}/customer-dashboard">თქვენს პანელზე</a>.</p>
@endsection
