from django.contrib.auth import authenticate
from drf_spectacular.utils import extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from core.paginators import CustomPaginator
from core.filters import SetFilter
from core.models import Set

from core.serializers.set_serializers import (
    UpdateSetSerializer,
    CreateSetSerializer,
    SetSerializer,
)
from core.utils import global_response_errors

from .documents import (
    create_set_document,
    list_set_document,
    update_set_document,
    retrieve_set_document,
    delete_set_document,
)


class _BaseSetViewSet:
    def get_id(self, pk):
        if not pk or not pk.isdigit():
            return None, {
                "status": False,
                "message": "Invalid ID. ID must be an integer!",
            }
        return int(pk), None

    def get_set(self, pk):
        try:
            set = Set.objects.get(pk=pk)
            return set, None
        except Set.DoesNotExist:
            return None, {"status": False, "message": "set does not exist!"}


class SetViewSet(viewsets.ViewSet, _BaseSetViewSet):

    @extend_schema(**list_set_document)
    def list(self, request):
        filter_params = request.GET.dict()
        sets = SetFilter(
            filter_params, queryset=Set.objects.prefetch_related("questions__answers").order_by("created_at")
        )
        paginator = CustomPaginator()
        page = paginator.paginate_queryset(sets.qs, request)
        serializer = SetSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


    @extend_schema(**create_set_document)
    def create(self, request):
        serializer = CreateSetSerializer(data=request.data)
        if serializer.is_valid():
            set = serializer.save()
            return Response(
                {
                    "status" : True,
                    "data": SetSerializer(set).data,
                    "message":"Set created successfully!",

                },
                status=status.HTTP_201_CREATED,
            )
        return global_response_errors(serializer.errors)


    @extend_schema(**update_set_document)
    def update(self, request, pk=None):
        pk, error_response = self.get_id(pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        set, error_response = self.get_set(pk=pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        serializer = UpdateSetSerializer(
            instance=set, data=request.data, partial=True
        )
        if serializer.is_valid():
            set = serializer.save()
            return Response(
                {
                    "status":True,
                    "data":SetSerializer(set).data,
                    "message": "Set updated successfully!"
                },
                status=status.HTTP_200_OK,
            )
        return global_response_errors(serializer.errors)


    @extend_schema(**retrieve_set_document)
    def retrieve(self, request, pk=None):
        pk, error_response = self.get_id(pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        set, error_response = self.get_set(pk=pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        serializer = SetSerializer(set)
        return Response(
            {
                "status":True,
                "data":serializer.data,
            },
            status=status.HTTP_200_OK,
        )


    @extend_schema(**delete_set_document)
    def destroy(self, request, pk=None):

        pk, error_response = self.get_id(pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        set, error_response = self.get_set(pk=pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        set.delete()
        return Response(
            {
                "status":True,
                "message": "Set deleted successfully!"
            },
            status=status.HTTP_200_OK,
        )


