@extends('emails.layout')

@section('title', 'ახალი შეკვეთა')

@section('content')
  <h1>ახალი შეკვეთა</h1>
  @if($order->order_type === 'remodel')
    <p>მომხმარებელმა გადაიხადა ფასის პირველი ნახევარი. სამოსს კურიერი მოგიტანთ — მიღებისას, მუშაობის დაწყებამდე, ატვირთეთ მისი ფოტოები თქვენს პანელზე.</p>
  @elseif($order->order_type === 'marketplace')
    <p>გადახდილი შეკვეთა გელოდებათ. შედით პანელზე, გადახედეთ დეტალებს და დაიწყეთ მუშაობა.</p>
  @else
    <p>ახალი შეკვეთა გელოდებათ. შედით პანელზე, გადახედეთ დეტალებს და მიიღეთ შეკვეთა.</p>
  @endif

  <div class="row"><span class="label">შეკვეთა</span><span class="value">{{ $order->order_number }}</span></div>
  <div class="row"><span class="label">ტიპი</span><span class="value">{{ ['marketplace' => 'მარკეტპლეისი', 'custom' => 'ინდივიდუალური დიზაინი', 'remodel' => 'გადაკეთება'][$order->order_type] ?? $order->order_type }}</span></div>
  <div class="row"><span class="label">მომხმარებელი</span><span class="value">{{ trim(($customer->first_name ?? '') . ' ' . ($customer->last_name ?? '')) ?: $customer->name }}</span></div>
  @if($order->total > 0)
  <div class="row"><span class="label">ჯამი</span><span class="value">₾{{ number_format($order->total, 2) }}</span></div>
  @endif

  <p style="margin-top:20px">შეკვეთის სამართავად გადადით <a href="{{ config('app.url') }}/tailor-dashboard">მკერავის პანელზე</a>.</p>
@endsection
