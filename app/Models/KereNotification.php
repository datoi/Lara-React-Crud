<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KereNotification extends Model
{
    protected $table = 'kere_notifications';

    protected $fillable = [
        'user_id',
        'type',
        'title',
        'body',
        'data',
        'is_read',
    ];

    protected $casts = [
        'data'    => 'array',
        'is_read' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
