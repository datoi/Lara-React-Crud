@extends('emails.layout')

@section('title', 'ახალი რეგისტრაცია')

@section('content')
  @php($isTailor = $user->role === 'tailor')
  <h1>{{ $isTailor ? 'ახალი მკერავი დარეგისტრირდა' : 'ახალი მომხმარებელი დარეგისტრირდა' }}</h1>

  <div class="row"><span class="label">სახელი</span><span class="value">{{ $user->getFullName() }}</span></div>
  <div class="row"><span class="label">როლი</span><span class="value">{{ $isTailor ? 'მკერავი' : 'მომხმარებელი' }}</span></div>
  <div class="row"><span class="label">დრო</span><span class="value">{{ $user->created_at->timezone('Asia/Tbilisi')->format('Y-m-d H:i') }} (თბილისი)</span></div>

  <div style="margin-top: 24px;">
    @if ($isTailor)
      <p>მკერავის განაცხადი დადასტურებას ელოდება. გადახედეთ და დაადასტურეთ ან უარყავით ადმინ-პანელში.</p>
    @endif

    <a href="{{ config('app.url') }}/admin-dashboard" class="cta">ადმინ-პანელის გახსნა</a>
  </div>
@endsection

@section('footer')
  ამ წერილს იღებთ, რადგან Kere-ის სერვერზე ეს მისამართი მითითებულია ახალი რეგისტრაციების შეტყობინებებისთვის (REGISTRATION_ALERT_EMAIL). წერილზე პასუხი არ მიიღება.
@endsection
